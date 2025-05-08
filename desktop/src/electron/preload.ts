import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('system', {
  fetch: (url: string) => ipcRenderer.invoke('fetch', url),
});

// Expose simplified electron API for window state
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
  },
  showNativeMenu: (options, selectedValue, position) => {
    return ipcRenderer.invoke(
      'showNativeMenu',
      options,
      selectedValue,
      position
    );
  },
  platform: process.platform,
  onWindowStateChange: (callback) => {
    // Handle fullscreen event
    ipcRenderer.on('window:enter-fullscreen', () => {
      callback(true);
    });

    // Handle exit fullscreen event
    ipcRenderer.on('window:leave-fullscreen', () => {
      callback(false);
    });
  },

  isFullScreen: () => ipcRenderer.invoke('isFullScreen'),

  // Cleanup method
  removeWindowStateListeners: () => {
    ipcRenderer.removeAllListeners('window:enter-fullscreen');
    ipcRenderer.removeAllListeners('window:leave-fullscreen');
  },
});
