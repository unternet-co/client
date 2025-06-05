/// <reference types="vite/client" />

import type {
  IFileService,
  FileChangeEvent,
} from './src/files/file-service.interface';

declare global {
  interface Window {
    fileService: IFileService & {
      onFileChanged: (callback: (event: FileChangeEvent) => void) => void;
      removeFileChangeListeners: () => void;
    };
    system: {
      fetch: (url: string) => Promise<Response>;
    };
    electronAPI?: {
      showNativeMenu?: (
        options: MenuItemConstructorOptions[],
        selectedValue: string | null,
        position?: { x?: number; y?: number }
      ) => Promise<string | null>;
      onWindowStateChange: (callback: (isFullscreen: boolean) => void) => void;
      removeWindowStateListeners: () => void;
      platform: string;
      isFullScreen: () => Promise<boolean>;
      ipcRenderer: IpcRenderer;
    };
  }
}

// This empty export makes this file a module
export {};
