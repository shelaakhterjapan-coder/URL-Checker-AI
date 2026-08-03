const DEFAULT_URL = 'https://example.com'; // change to a site that allows embedding if you like

let tabCount = 0;
let activeTabId = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('new-tab-btn').addEventListener('click', () => createTab());
  document.getElementById('back-btn').addEventListener('click', () => goBack());
  document.getElementById('forward-btn').addEventListener('click', () => goForward());
  document.getElementById('reload-btn').addEventListener('click', () => reload());
  document.getElementById('url-bar').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navigateToInput();
  });
  createTab(DEFAULT_URL);
});

function createTab(url = DEFAULT_URL) {
  tabCount++;
  const tabId = `tab-${tabCount}`;

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.id = `tab-btn-${tabId}`;
  tabEl.innerHTML = `<span class="tab-title">New Tab</span><button class="tab-close">×</button>`;
  document.getElementById('tabs').appendChild(tabEl);

  const iframe = document.createElement('iframe');
  iframe.id = `view-${tabId}`;
  iframe.src = url;
  iframe.style.position = 'absolute';
  iframe.style.top = `${document.getElementById('tab-bar').offsetHeight + document.getElementById('nav-bar').offsetHeight}px`;
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = `calc(100% - ${document.getElementById('tab-bar').offsetHeight + document.getElementById('nav-bar').offsetHeight}px)`;
  iframe.style.border = 'none';
  iframe.dataset.url = url;
  document.getElementById('views-container').appendChild(iframe);

  tabEl.addEventListener('click', () => switchTab(tabId));
  tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });

  switchTab(tabId);
}

function switchTab(tabId) {
  activeTabId = tabId;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('#views-container iframe').forEach(f => f.style.display = 'none');
  const view = document.getElementById(`view-${tabId}`);
  if (view) {
    view.style.display = 'block';
    document.getElementById('url-bar').value = view.dataset.url || view.src || '';
  }
}

function closeTab(tabId) {
  const btn = document.getElementById(`tab-btn-${tabId}`);
  const view = document.getElementById(`view-${tabId}`);
  if (btn) btn.remove();
  if (view) view.remove();
  const remaining = document.querySelectorAll('.tab');
  if (remaining.length) {
    const nextId = remaining[remaining.length - 1].id.replace('tab-btn-', '');
    switchTab(nextId);
  } else {
    createTab();
  }
}

function navigateToInput() {
  const value = document.getElementById('url-bar').value.trim();
  let url = value;
  if (!/^https?:\/\//i.test(url)) {
    if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
    else url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
  }
  const view = document.getElementById(`view-${activeTabId}`);
  if (view) {
    view.src = url;
    view.dataset.url = url;
  }
}

function goBack() {
  const view = document.getElementById(`view-${activeTabId}`);
  try {
    if (view && view.contentWindow && view.contentWindow.history.length > 0) view.contentWindow.history.back();
  } catch (e) {}
}
function goForward() {
  const view = document.getElementById(`view-${activeTabId}`);
  try { if (view && view.contentWindow) view.contentWindow.history.forward(); } catch (e) {}
}
function reload() {
  const view = document.getElementById(`view-${activeTabId}`);
  if (view) view.src = view.src;
}
