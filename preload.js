const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createTab: (url) => ipcRenderer.invoke('create-tab', url),
  switchTab: (tabId) => ipcRenderer.invoke('switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('close-tab', tabId),
  navigate: (tabId, url) => ipcRenderer.invoke('navigate', tabId, url),
  goBack: (tabId) => ipcRenderer.invoke('go-back', tabId),
  goForward: (tabId) => ipcRenderer.invoke('go-forward', tabId),
  reload: (tabId) => ipcRenderer.invoke('reload', tabId),
  getUrlForTab: (tabId) => ipcRenderer.invoke('get-url', tabId),
  updateViewBounds: (topOffsetPx) => ipcRenderer.invoke('update-view-bounds', topOffsetPx),

  onTabUpdated: (callback) => {
    ipcRenderer.on('tab-updated', (event, data) => callback(data));
  },
  onTabCreated: (callback) => {
    ipcRenderer.on('tab-created', (event, data) => callback(data));
  },
  onTabClosed: (callback) => {
    ipcRenderer.on('tab-closed', (event, data) => callback(data));
  },
  onTabSwitched: (callback) => {
    ipcRenderer.on('tab-switched', (event, data) => callback(data));
  }
});
