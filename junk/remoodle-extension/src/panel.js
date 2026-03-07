const out = document.getElementById('output');
const sendBtn = document.getElementById('sendBtn');
const showBtn = document.getElementById('showBtn');
const clearBtn = document.getElementById('clearBtn');

function print(data) {
  out.value = JSON.stringify(data, null, 2);
}

const rpc = (type, payload={}) => new Promise(res => chrome.runtime.sendMessage({ type, ...payload }, res));

rpc('GET_CONFIG').then(r => {
  if (!r.ok || !r.data) {
    alert('Не удалось получить конфиг из bg.js');

    return;
  }

  const config = r.data;

  document.querySelector('.config div:nth-child(2) span').innerText += ` ${config.MSONLINE_DOMAIN}`;
  document.querySelector('.config div:nth-child(3) span').innerText += ` ${config.COOKIE_KEYS.join(', ')}`;
})

async function readIntercepted() {
  const { intercepted = [] } = await chrome.storage.local.get(['intercepted']);

  return intercepted;
}

async function showIntercepted() {
  const intercepted = await readIntercepted();
  print(intercepted);
}

async function clearIntercepted() {
  await chrome.storage.local.remove('intercepted');
  print([]);
}

async function sendToBackend() {
  const r = await rpc('SEND_TO_BACKEND');

  if (!r.ok) {
    alert(r.error || 'Не удалось отправить');

    return;
  }

  alert(r.message);
}

sendBtn.addEventListener('click', sendToBackend);
showBtn.addEventListener('click', showIntercepted);
clearBtn.addEventListener('click', clearIntercepted);

showIntercepted();
