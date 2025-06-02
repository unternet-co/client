import { contextBridge, ipcRenderer, OpenDialogOptions } from 'electron';

// Custom implementation of path handling without Node.js modules
function isAbsolutePath(filePath: string): boolean {
  return filePath.startsWith('/') || /^[A-Za-z]:[\\/]/.test(filePath);
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
}

// Custom implementation of pathToFileURL that doesn't rely on Node.js modules
function customPathToFileURL(filePath: string): string {
  try {
    // Normalize the path to use forward slashes
    const normalizedPath = normalizePath(filePath);

    // Handle absolute paths
    if (isAbsolutePath(normalizedPath)) {
      // Ensure the path starts with a single forward slash
      const cleanPath = normalizedPath.replace(/^\/+/, '/');
      return `file://${cleanPath}`;
    }

    // For relative paths, we'll need to get the current working directory from the main process
    // This is a temporary solution - we should probably handle this differently
    return `file://${normalizedPath}`;
  } catch (error) {
    console.error('Error converting path to file URL:', error);
    // Fallback to a basic file:// URL
    return `file://${filePath.replace(/\\/g, '/')}`;
  }
}

// Custom implementation of fileURLToPath that doesn't rely on Node.js modules
function customFileURLToPath(fileURL: string): string {
  try {
    // Remove the file:// protocol
    const path = fileURL.replace(/^file:\/\//, '');
    // Decode any URL-encoded characters
    return decodeURIComponent(path);
  } catch (error) {
    console.error('Error converting file URL to path:', error);
    // Fallback to just removing the protocol
    return fileURL.replace(/^file:\/\//, '');
  }
}

contextBridge.exposeInMainWorld('system', {
  fetch: (url: string) => ipcRenderer.invoke('fetch', url),
});

// Expose simplified electron API for window state
contextBridge.exposeInMainWorld('electronAPI', {
  ipcRenderer: {
    on: ipcRenderer.on.bind(ipcRenderer),
    removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
  },
  showOpenDialog: (options: OpenDialogOptions) =>
    ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options: {
    type: string;
    buttons: string[];
    defaultId: number;
    title: string;
    message: string;
  }) => ipcRenderer.invoke('show-message-box', options),
  openFileWithDefault: (filePath: string) =>
    ipcRenderer.invoke('open-file-with-default', filePath),
  showNativeMenu: (
    options: Electron.MenuItemConstructorOptions[],
    selectedValue: string | null,
    position?: { x?: number; y?: number }
  ) => {
    return ipcRenderer.invoke(
      'showNativeMenu',
      options,
      selectedValue,
      position
    );
  },
  platform: process.platform,
  pathToFileURL: customPathToFileURL,
  fileURLToPath: customFileURLToPath,
  onWindowStateChange: (callback: (isFullscreen: boolean) => void) => {
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

  // File system API
  fs: {
    readFile: (filePath: string, encoding?: 'utf8' | 'binary') =>
      ipcRenderer.invoke('fs:readFile', filePath, encoding),
    readdir: (dirPath: string, withFileTypes?: boolean) =>
      ipcRenderer.invoke('fs:readdir', dirPath, withFileTypes),
    stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
    lstat: (filePath: string) => ipcRenderer.invoke('fs:lstat', filePath),
  },

  // File watcher API
  fileWatcher: {
    start: (basePath: string) =>
      ipcRenderer.invoke('file-watcher:start', basePath),
    stop: (basePath: string) =>
      ipcRenderer.invoke('file-watcher:stop', basePath),
    onEvent: (
      callback: (event: {
        type: 'add' | 'change' | 'unlink';
        path: string;
      }) => void
    ) => {
      ipcRenderer.on('file-watcher:event', (_, event) => callback(event));
    },
    onError: (callback: (error: { path: string; error: string }) => void) => {
      ipcRenderer.on('file-watcher:error', (_, error) => callback(error));
    },
    removeListeners: () => {
      ipcRenderer.removeAllListeners('file-watcher:event');
      ipcRenderer.removeAllListeners('file-watcher:error');
    },
  },
});
