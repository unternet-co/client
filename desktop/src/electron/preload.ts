import { contextBridge, ipcRenderer } from 'electron';
import type {
  IFileService,
  FileChangeEvent,
} from '../files/file-service.interface';

// Create file service proxy using IPC calls directly
const fileService: IFileService = {
  read: (path: string) => ipcRenderer.invoke('fileService:read', path),
  write: (path: string, content: string) =>
    ipcRenderer.invoke('fileService:write', path, content),
  exists: (path: string) => ipcRenderer.invoke('fileService:exists', path),
  watch: (path: string) => ipcRenderer.invoke('fileService:watch', path),
  unwatch: (path: string) => ipcRenderer.invoke('fileService:unwatch', path),
  getAppDataPath: () => ipcRenderer.invoke('fileService:getAppDataPath'),
};

// File change event listener management
let fileChangeListeners: ((event: FileChangeEvent) => void)[] = [];

// Listen for file change events from main process
ipcRenderer.on('fileService:changed', (_, event: FileChangeEvent) => {
  fileChangeListeners.forEach((callback) => callback(event));
});

try {
  // Expose the file service with additional event handling methods
  contextBridge.exposeInMainWorld('fileService', {
    // IPC methods
    ...fileService,
    // Custom event handling methods
    onFileChanged: (callback: (event: FileChangeEvent) => void) => {
      fileChangeListeners.push(callback);
    },
    removeFileChangeListeners: () => {
      fileChangeListeners = [];
    },
  });

  console.log('File service exposed to main world');
} catch (error) {
  console.error('Error setting up fileService:', error);
}

contextBridge.exposeInMainWorld('system', {
  fetch: (url: string) => ipcRenderer.invoke('fetch', url),
});

console.log('System API exposed to main world');

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
