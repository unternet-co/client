declare global {
  interface Window {
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

export {};
