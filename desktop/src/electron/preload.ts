import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('system', {
  fetch: (url) => ipcRenderer.invoke('fetch', url),
});
