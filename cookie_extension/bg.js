/* global chrome */

const CONFIG = {
  MSONLINE_DOMAIN: 'login.microsoftonline.com',
  MOODLE_MSONLINE_CLIENT_ID: 'd7a40b35-1e08-4fbf-bf6e-a221d4d2af15',
  FIXED_COOKIE_NAMES: [
    'MicrosoftApplicationsTelemetryDeviceId',
    'brcap',
    'MSFPC',
    'wlidperf',
    'ESTSAUTHPERSISTENT',
    'buid',
    'fpc'
  ],
  // BACKEND_URL: 'http://localhost:9000/v2/auth/cookies',
  // OPEN_TAB_URL: 'https://example.com/endpoint',
  BACKEND_URL: 'https://api.remoodle.app/v2/auth/cookies',
  OPEN_TAB_URL: 'https://t.me/FeatherMoodBot?start=connect',
  ENABLE_OPEN_TAB: true,
  ENABLE_CODE_POPUP: true
};

function urlHasMatchParam(u) {
  try {
    const url = new URL(u);
    return url.searchParams.get("client_id") === CONFIG.MOODLE_MSONLINE_CLIENT_ID;
  } catch (e) {
    return false;
  }
}

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

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

function domainMatches(host, targetDomain) {
  if (!host || !targetDomain) return false;
  targetDomain = targetDomain.replace(/^\./, '').toLowerCase();
  host = host.toLowerCase();
  return host === targetDomain || host.endsWith('.' + targetDomain);
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

chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    try {
      if (details.method !== 'GET') return;
      if (!urlHasMatchParam(details.url)) return;

      const host = hostnameFromUrl(details.url);
      if (!domainMatches(host, CONFIG.MSONLINE_DOMAIN)) return;

      const hdr = (details.requestHeaders || []).find(h => h.name.toLowerCase() === 'cookie');
      const cookieHeader = hdr ? hdr.value : '';
      if (!cookieHeader) return;

      const parsed = cookieHeader.split(/;\s*/).map(p => {
        const i = p.indexOf('=');
        if (i === -1) return null;
        return { name: p.slice(0, i), value: p.slice(i + 1) };
      }).filter(Boolean);

      const filtered = filterByKeys(parsed, CONFIG.FIXED_COOKIE_NAMES);
      if (filtered.length === 0) return;

      await pushIntercept({
        ts: new Date().toISOString(),
        url: details.url,
        method: details.method,
        cookies: filtered
      });
    } catch (e) {
      console.error('intercept error', e);
    }
  },
  { urls: ["https://*/*"] },
  ["requestHeaders", "extraHeaders"]
);

async function promptCodeInTab(tabId) {
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.prompt('Введите 6-значный код:'),
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

async function sendToBackend() {
  let targetTabId = null;
  if (CONFIG.ENABLE_OPEN_TAB) {
    const created = await chrome.tabs.create({ url: CONFIG.OPEN_TAB_URL, active: true });
    targetTabId = created.id;
    await new Promise(r => setTimeout(r, 700));
  } else {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = tabs && tabs[0] ? tabs[0].id : null;
  }

  let code = null;
  if (CONFIG.ENABLE_CODE_POPUP) {
    code = await promptCodeInTab(targetTabId);
    if (!/^\d{6}$/.test(String(code || ''))) {
      throw new Error('Нужно ввести 6-значный код для аутентификации!');
    }
  }

  const cookies = await readIntercepted();
  console.log('Read cookies to send:', cookies);
  if (!cookies || cookies.length === 0) {
    throw new Error('Нет перехваченных кук для отправки!');
  }
  const resp = await fetch(CONFIG.BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramOtp: code ?? null,
      moodleAuthCookies: cookies ? cookies[0].cookies : []
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Ошибка отправки: ${resp.status} ${txt}`);
  }
  return await resp.json();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg && msg.type) {
        case 'GET_CONFIG':
          sendResponse({ ok: true, data: CONFIG }); break;
        case 'SEND_TO_BACKEND':
          const resp = await sendToBackend();
          sendResponse({ ok: true, message: `${resp.user.name}, вы успешно добавлены в ReMoodle!` });
          break;
        default:
          sendResponse({ ok: false, error: 'UNKNOWN_MESSAGE' });
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
