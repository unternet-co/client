const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('system', {
  fetch: (url) => ipcRenderer.invoke('fetch', url),
});
