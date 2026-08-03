const { app, BrowserWindow, BrowserView, ipcMain, shell } = require('electron');
const path = require('path');

let win;
let tabCount = 0;
const tabs = new Map(); // tabId -> { view, url }
let tabOrder = [];
let activeTabId = null;
let viewTopOffset = 96;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Custom Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.on('resize', () => updateAllViewBounds());
}

function boundsForView() {
  const [width, height] = win.getContentSize();
  const y = Math.max(0, Math.floor(viewTopOffset));
  return { x: 0, y, width, height: Math.max(0, height - y) };
}

function updateAllViewBounds() {
  const b = boundsForView();
  for (const { view } of tabs.values()) {
    try {
      view.setBounds(b);
      view.setAutoResize({ width: true, height: true });
    } catch (err) {
      // ignore
    }
  }
}

function createBrowserTab(initialUrl = 'https://www.google.com') {
  tabCount += 1;
  const tabId = `tab-${tabCount}`;

  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  tabs.set(tabId, { view, url: initialUrl });
  tabOrder.push(tabId);

  win.addBrowserView(view);
  const b = boundsForView();
  view.setBounds(b);
  view.setAutoResize({ width: true, height: true });

  view.webContents.loadURL(initialUrl).catch(() => {});

  view.webContents.on('page-title-updated', (e, title) => {
    win.webContents.send('tab-updated', { tabId, title });
  });

  const sendUrlUpdate = (url) => {
    const rec = tabs.get(tabId);
    if (rec) rec.url = url;
    win.webContents.send('tab-updated', { tabId, url });
  };

  view.webContents.on('did-navigate', (e, url) => sendUrlUpdate(url));
  view.webContents.on('did-navigate-in-page', (e, url) => sendUrlUpdate(url));
  view.webContents.on('did-finish-load', () => {
    try { sendUrlUpdate(view.webContents.getURL()); } catch (err) {}
  });

  view.webContents.setWindowOpenHandler(({ url }) => {
    if (!url) return { action: 'deny' };
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const newTabId = createBrowserTab(url);
      switchToTab(newTabId);
      win.webContents.send('tab-created', { tabId: newTabId, url });
      return { action: 'deny' };
    } else {
      shell.openExternal(url).catch(() => {});
      return { action: 'deny' };
    }
  });

  return tabId;
}

function switchToTab(tabId) {
  if (!tabs.has(tabId)) return false;
  const { view } = tabs.get(tabId);
  try {
    win.setBrowserView(view);
    const b = boundsForView();
    view.setBounds(b);
    view.setAutoResize({ width: true, height: true });
    activeTabId = tabId;
    win.webContents.send('tab-switched', { tabId });
    try {
      const url = view.webContents.getURL();
      win.webContents.send('tab-updated', { tabId, url });
    } catch (err) {}
  } catch (err) {
    return false;
  }
  return true;
}

function closeTabMain(tabId) {
  if (!tabs.has(tabId)) return false;
  const { view } = tabs.get(tabId);
  try {
    win.removeBrowserView(view);
    view.webContents.destroy();
  } catch (err) {}
  tabs.delete(tabId);
  tabOrder = tabOrder.filter(t => t !== tabId);

  if (activeTabId === tabId) {
    if (tabOrder.length > 0) {
      switchToTab(tabOrder[tabOrder.length - 1]);
    } else {
      activeTabId = null;
    }
  }

  win.webContents.send('tab-closed', { tabId });
  return true;
}

function navigateTab(tabId, url) {
  const rec = tabs.get(tabId);
  if (!rec) return false;
  rec.view.webContents.loadURL(url).catch(() => {});
  return true;
}
function goBackTab(tabId) {
  const rec = tabs.get(tabId);
  if (!rec) return false;
  if (rec.view.webContents.canGoBack()) rec.view.webContents.goBack();
  return true;
}
function goForwardTab(tabId) {
  const rec = tabs.get(tabId);
  if (!rec) return false;
  if (rec.view.webContents.canGoForward()) rec.view.webContents.goForward();
  return true;
}
function reloadTab(tabId) {
  const rec = tabs.get(tabId);
  if (!rec) return false;
  rec.view.webContents.reload();
  return true;
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('create-tab', async (event, url) => {
    const tabId = createBrowserTab(url || 'https://www.google.com');
    switchToTab(tabId);
    return { tabId, url };
  });

  ipcMain.handle('switch-tab', async (event, tabId) => {
    return switchToTab(tabId);
  });

  ipcMain.handle('close-tab', async (event, tabId) => {
    return closeTabMain(tabId);
  });

  ipcMain.handle('navigate', async (event, tabId, url) => {
    return navigateTab(tabId, url);
  });

  ipcMain.handle('go-back', async (event, tabId) => {
    return goBackTab(tabId);
  });

  ipcMain.handle('go-forward', async (event, tabId) => {
    return goForwardTab(tabId);
  });

  ipcMain.handle('reload', async (event, tabId) => {
    return reloadTab(tabId);
  });

  ipcMain.handle('get-url', async (event, tabId) => {
    const rec = tabs.get(tabId);
    if (!rec) return null;
    try { return rec.view.webContents.getURL(); } catch (err) { return rec.url || null; }
  });

  ipcMain.handle('update-view-bounds', async (event, topOffsetPx) => {
    viewTopOffset = Number(topOffsetPx) || viewTopOffset;
    updateAllViewBounds();
    return true;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
