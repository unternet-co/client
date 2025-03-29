import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("system", {
  fetch: (url) => ipcRenderer.invoke("fetch", url),
});

// Expose simplified electron API for window state
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  onWindowStateChange: (callback) => {
    // Handle fullscreen event
    ipcRenderer.on("window:enter-fullscreen", () => {
      callback(true);
    });

    // Handle exit fullscreen event
    ipcRenderer.on("window:leave-fullscreen", () => {
      callback(false);
    });
  },

  isFullScreen: () => ipcRenderer.invoke("isFullScreen"),

  // Cleanup method
  removeWindowStateListeners: () => {
    ipcRenderer.removeAllListeners("window:enter-fullscreen");
    ipcRenderer.removeAllListeners("window:leave-fullscreen");
  },
});
