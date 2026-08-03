let tabsUI = new Map();
let activeTabId = null;
const DEFAULT_URL = 'https://www.google.com';

document.addEventListener('DOMContentLoaded', async () => {
  bindUIControls();
  updateViewBounds();
  window.addEventListener('resize', debounce(updateViewBounds, 120));

  window.electronAPI.onTabUpdated(handleTabUpdated);
  window.electronAPI.onTabCreated(handleTabCreatedFromMain);
  window.electronAPI.onTabClosed(handleTabClosedFromMain);
  window.electronAPI.onTabSwitched(handleTabSwitchedFromMain);

  const res = await window.electronAPI.createTab(DEFAULT_URL);
  if (res && res.tabId) {
    createTabUI(res.tabId, res.url);
    setActiveUI(res.tabId);
    document.getElementById('url-bar').value = res.url || '';
  }
});

function bindUIControls() {
  document.getElementById('new-tab-btn').addEventListener('click', async () => {
    const r = await window.electronAPI.createTab(DEFAULT_URL);
    if (r && r.tabId) {
      createTabUI(r.tabId, r.url);
      setActiveUI(r.tabId);
    }
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    if (activeTabId) window.electronAPI.goBack(activeTabId);
  });
  document.getElementById('forward-btn').addEventListener('click', () => {
    if (activeTabId) window.electronAPI.goForward(activeTabId);
  });
  document.getElementById('reload-btn').addEventListener('click', () => {
    if (activeTabId) window.electronAPI.reload(activeTabId);
  });

  document.getElementById('url-bar').addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && activeTabId) {
      let inputUrl = e.target.value.trim();
      if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        if (inputUrl.includes('.') && !inputUrl.includes(' ')) {
          inputUrl = 'https://' + inputUrl;
        } else {
          inputUrl = `https://www.google.com/search?q=${encodeURIComponent(inputUrl)}`;
        }
      }
      await window.electronAPI.navigate(activeTabId, inputUrl);
    }
  });
}

function createTabUI(tabId, url = 'about:blank') {
  if (tabsUI.has(tabId)) return;

  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.id = `tab-btn-${tabId}`;

  const titleSpan = document.createElement('span');
  titleSpan.className = 'tab-title';
  titleSpan.innerText = 'New Tab';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.type = 'button';
  closeBtn.innerText = '×';

  tab.appendChild(titleSpan);
  tab.appendChild(closeBtn);
  document.getElementById('tabs').appendChild(tab);

  tab.addEventListener('click', async () => {
    await window.electronAPI.switchTab(tabId);
    setActiveUI(tabId);
    const currentUrl = await window.electronAPI.getUrlForTab(tabId);
    if (currentUrl) document.getElementById('url-bar').value = currentUrl;
  });

  closeBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await window.electronAPI.closeTab(tabId);
    removeTabUI(tabId);
  });

  tabsUI.set(tabId, { btn: tab, titleSpan });
  if (!activeTabId) {
    setActiveUI(tabId);
    document.getElementById('url-bar').value = url || '';
  }
}

function setActiveUI(tabId) {
  activeTabId = tabId;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const el = document.getElementById(`tab-btn-${tabId}`);
  if (el) el.classList.add('active');
}

function removeTabUI(tabId) {
  const rec = tabsUI.get(tabId);
  if (!rec) return;
  const el = rec.btn;
  if (el) el.remove();
  tabsUI.delete(tabId);

  if (activeTabId === tabId) {
    const remaining = Array.from(tabsUI.keys());
    if (remaining.length > 0) {
      const next = remaining[remaining.length - 1];
      window.electronAPI.switchTab(next);
      setActiveUI(next);
      window.electronAPI.getUrlForTab(next).then(url => {
        if (url) document.getElementById('url-bar').value = url;
      });
    } else {
      window.electronAPI.createTab(DEFAULT_URL).then(res => {
        if (res && res.tabId) {
          createTabUI(res.tabId, res.url);
          setActiveUI(res.tabId);
        }
      });
    }
  }
}

function handleTabUpdated({ tabId, title, url }) {
  const rec = tabsUI.get(tabId);
  if (rec && title) rec.titleSpan.innerText = title;
  if (tabId === activeTabId && url) {
    document.getElementById('url-bar').value = url;
  }
}
function handleTabCreatedFromMain({ tabId, url }) { createTabUI(tabId, url); }
function handleTabClosedFromMain({ tabId }) { removeTabUI(tabId); }
function handleTabSwitchedFromMain({ tabId }) {
  setActiveUI(tabId);
  window.electronAPI.getUrlForTab(tabId).then(url => {
    if (url) document.getElementById('url-bar').value = url;
  });
}

function updateViewBounds() {
  const tabBar = document.getElementById('tab-bar');
  const navBar = document.getElementById('nav-bar');
  const offset = ((tabBar ? tabBar.offsetHeight : 0) + (navBar ? navBar.offsetHeight : 0));
  window.electronAPI.updateViewBounds(offset);
}

function debounce(fn, ms = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
