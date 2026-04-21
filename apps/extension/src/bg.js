/* global chrome */

const CONFIG = {
  MSONLINE_DOMAIN: 'login.microsoftonline.com',
  MSONLINE_PATHS: [
    '/organizations/oauth2/authorize',
    '/common/reprocess',
  ],
  COOKIE_KEYS: [
    'MicrosoftApplicationsTelemetryDeviceId',
    'brcap',
    'MSFPC',
    'wlidperf',
    'ESTSAUTHPERSISTENT',
    'buid',
    'fpc'
  ],
  // BACKEND_URL: 'http://localhost:9000/v2/auth/cookies',
  // OPEN_TAB_URL: 'https://ifconfig.me/',
  BACKEND_URL: 'https://api.remoodle.app/v2/auth/cookies',
  OPEN_TAB_URL: 'https://t.me/FeatherMoodBot?start=connect',
  ENABLE_OPEN_TAB: true,
  ENABLE_CODE_POPUP: true,
  MAX_ACCOUNT_SELECTION_ATTEMPTS: 3,
};

CONFIG.MSONLINE_DOMAIN = CONFIG.MSONLINE_DOMAIN.replace(/^\./, '').toLowerCase();

function parseCookiesFromHeader(cookieHeader) {
  const result = [];

  if (!cookieHeader) return result;

  const pairs = cookieHeader.split(/;\s*/);

  for (const p of pairs) {
    const idx = p.indexOf('=');

    if (idx === -1) continue;

    const name = p.slice(0, idx);
    const value = p.slice(idx + 1);

    result.push({ name, value });
  }

  return result;
}

function domainMatches(url) {
  const host = url.hostname?.toLowerCase();
  const targetHost = CONFIG.MSONLINE_DOMAIN;

  if (!host || !targetHost) return false;

  return host === targetHost || host.endsWith('.' + targetHost);
}

function pathMatches(url) {
  try {
    const path = url.pathname || '/';

    return CONFIG.MSONLINE_PATHS.some(p => p === path);
  } catch (e) {
    return false;
  }
}

function filterByKeys(list, keys) {
  if (!keys || keys.length === 0) return list;

  const set = new Set(keys.map(k => k.trim()).filter(Boolean));

  return list.filter(c => set.has(c.name));
}

async function pushIntercept(item) {
  const intercepted = [item];

  await chrome.storage.local.set({ intercepted });
}

chrome.webRequest.onHeadersReceived.addListener(
  async (details) => {
    try {
      if (details.method !== 'GET') return;

      const url = new URL(details.url);
      if (!domainMatches(url)) return;
      if (!pathMatches(url)) return;

      const setCookieHeaders = (details.responseHeaders || []).filter((h) => h.name && h.name.toLowerCase() === 'set-cookie');

      if (setCookieHeaders.length === 0) return;

      const parsed = [];

      for (const h of setCookieHeaders) {
        const v = (h.value || '').trim();
        const i = v.indexOf('=');

        if (i === -1) continue;

        const name = v.slice(0, i).trim();
        const value = v.slice(i + 1).split(';')[0];

        parsed.push({ name, value });
      }

      const filtered = filterByKeys(parsed, CONFIG.COOKIE_KEYS);

      if (filtered.length === 0) return;

      await pushIntercept({
        ts: new Date().toISOString(),
        url: details.url,
        method: details.method,
        type: 'response',
        cookies: filtered,
      });
    } catch (e) {
      console.error('onHeadersReceived handler error:', e);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
);

async function executeInTab(tabId, func, args) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });

    return res && res[0] ? res[0].result : null;
  } catch {
    return null;
  }
}

async function readIntercepted() {
  const { intercepted = [] } = await chrome.storage.local.get(['intercepted']);

  return intercepted;
}

async function sendToBackend(msAccountId, opts={}) {
  const { reuseTabId = null } = opts;
  let { code = null } = opts;

  let targetTabId = reuseTabId;
  let createdTabId = null;

  if (!reuseTabId && CONFIG.ENABLE_OPEN_TAB) {
    const created = await chrome.tabs.create({ url: CONFIG.OPEN_TAB_URL, active: true });

    targetTabId = created.id;
    createdTabId = created.id;

    await new Promise(r => setTimeout(r, 700));
  } else {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    targetTabId = tabs && tabs[0] ? tabs[0].id : null;
  }

  if (!code && CONFIG.ENABLE_CODE_POPUP) {
    code = await executeInTab(
      targetTabId,
      () => window.prompt('Введите 6-значный код:'),
      [],
    );

    if (!/^\d{6}$/.test(String(code || ''))) {
      throw new Error('Нужно ввести 6-значный код для аутентификации!');
    }
  }

  const cookies = await readIntercepted();
  console.log('Read cookies to send:', cookies);

  if (!cookies || cookies.length === 0) {
    throw new Error('Нет перехваченных кук для отправки!');
  }

  const payload = {
    telegramOtp: code ?? null,
    moodleAuthCookies: cookies[0].cookies ?? [],
  };

  if (msAccountId) payload.msAccountId = msAccountId;

  const resp = await fetch(CONFIG.BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();

  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!resp.ok && resp.status !== 409) {
    throw new Error(`Ошибка отправки: ${resp.status} ${text || ''}`.trim());
  }

  if (!json) {
    throw new Error(`Ошибка отправки: ${resp.status} ${text || ''}`.trim());
  }

  return { code, json };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg && msg.type) {
        case 'GET_CONFIG': {
          sendResponse({ ok: true, data: CONFIG });

          break;
        }
        case 'SEND_TO_BACKEND': {
          let { code, json: resp } = await sendToBackend();

          if (resp?.extra && Array.isArray(resp.extra.accounts) && resp.extra.accounts.length > 1) {
            const accounts = resp.extra.accounts;

            let tabId = null;

            const accountNames = accounts
              .map((a, i) => `${i + 1}: ${a.name} (${a.email})`)
              .join('\n');

            let selectedIndex = null;

            for (let attempt = 0; attempt < CONFIG.MAX_ACCOUNT_SELECTION_ATTEMPTS; attempt++) {
              const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
              tabId = tabs && tabs[0] ? tabs[0].id : (_sender?.tab?.id ?? null);
              if (!tabId) {
                sendResponse({ ok: false, error: 'NO_ACTIVE_TAB' });
                return;
              }

              const selection = await executeInTab(
                tabId,
                (names) => window.prompt(`Выберите аккаунт для подключения, введите номер:\n${names}`),
                [accountNames],
              );

              if (!selection) {
                console.log('User cancelled account selection, attempt', attempt);
                await executeInTab(
                  tabId,
                  () => window.alert('Выбор аккаунта отменён пользователем!'),
                  []
                );

                if (attempt === CONFIG.MAX_ACCOUNT_SELECTION_ATTEMPTS - 1) {
                  sendResponse({ ok: false, error: 'CANCELLED_BY_USER' });

                  return;
                }

                continue;
              }

              const idx = Number.parseInt(selection, 10) - 1;

              if (Number.isInteger(idx) && idx >= 0 && idx < accounts.length) {
                selectedIndex = idx;

                break;
              }

              await executeInTab(
                tabId,
                () => window.alert('Неверный выбор аккаунта!'),
                []
              );
            }

            if (selectedIndex == null) {
              sendResponse({ ok: false, error: 'INVALID_SELECTION_MAX_ATTEMPTS' });

              return;
            }

            const account = accounts[selectedIndex];

            ({ json: resp } = await sendToBackend(account.id, { reuseTabId: tabId, code }));
          }

          sendResponse({ ok: true, message: `${resp.user.name}, вы успешно добавлены в ReMoodle!` });

          break;
        }
        default: {
          sendResponse({ ok: false, error: 'UNKNOWN_MESSAGE' });
        }
      }
    } catch (e) {
      sendResponse({ ok: false, error: e.message || String(e) });
    }
  })();

  return true;
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('panel.html') });
});
