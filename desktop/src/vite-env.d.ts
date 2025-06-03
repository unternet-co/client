/// <reference types="vite/client" />

// Declare MiniSearch module if types are not available
declare module 'minisearch';

// System interface for Vite environment
interface System {
  fetch: (url: string) => Promise<string>;
}

declare global {
  const system: System;
}

// File System API types
interface FileSystemAPI {
  readFile: (
    filePath: string,
    encoding?: 'utf8' | 'binary'
  ) => Promise<{ content: string } | { error: string }>;
  readdir: (
    dirPath: string,
    withFileTypes?: boolean
  ) => Promise<
    | {
        success: boolean;
        entries: Array<{
          name: string;
          isDirectory?: boolean;
          isFile?: boolean;
        }>;
      }
    | { error: string }
  >;
  stat: (
    filePath: string
  ) => Promise<
    | {
        success: boolean;
        stats: {
          isDirectory: boolean;
          isFile: boolean;
          size: number;
          mtimeMs: number;
        };
      }
    | { error: string }
  >;
  lstat: (
    filePath: string
  ) => Promise<
    | {
        success: boolean;
        stats: {
          isDirectory: boolean;
          isFile: boolean;
          isSymbolicLink: boolean;
          size: number;
          mtimeMs: number;
        };
      }
    | { error: string }
  >;
}

// File Watcher API types
interface FileWatcherAPI {
  start: (
    basePath: string
  ) => Promise<{ success: boolean } | { error: string }>;
  stop: (basePath: string) => Promise<{ success: boolean } | { error: string }>;
  onEvent: (
    callback: (event: {
      type: 'add' | 'change' | 'unlink';
      path: string;
    }) => void
  ) => void;
  onError: (callback: (error: { path: string; error: string }) => void) => void;
  removeListeners: () => void;
}

// Main Electron API interface that combines all Electron-specific functionality
interface ElectronAPI {
  // Dialog and UI APIs
  showOpenDialog: (
    options: any
  ) => Promise<{ canceled: boolean; filePaths: string[] }>;
  showMessageBox: (options: {
    type: string;
    buttons: string[];
    defaultId: number;
    title: string;
    message: string;
  }) => Promise<{ response: number }>;
  showNativeMenu?: (
    options: MenuItemConstructorOptions[],
    selectedValue: string | null,
    position?: { x?: number; y?: number }
  ) => Promise<string | null>;

  // Window state management
  onWindowStateChange: (callback: (isFullscreen: boolean) => void) => void;
  removeWindowStateListeners: () => void;
  isFullScreen: () => Promise<boolean>;

  // Platform and IPC
  platform: string;
  ipcRenderer: IpcRenderer;

  // File system utilities
  pathToFileURL: (path: string) => string;
  fileURLToPath: (fileURL: string) => string;
  openFileWithDefault: (
    filePath: string
  ) => Promise<{ success: boolean } | { error: string }>;

  // File system and watcher APIs
  fs: FileSystemAPI;
  fileWatcher: FileWatcherAPI;
}

// Extend Window interface with Electron API
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// This empty export makes this file a module
export {};
