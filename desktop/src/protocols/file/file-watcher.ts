import * as path from 'path';

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string; // Relative path from the basePath of the watcher
}

export class FileWatcher {
  private basePath: string;
  private isWatching: boolean = false;
  private hasListeners: boolean = false;

  constructor(
    basePath: string,
    private onChange: (event: FileChangeEvent) => void
  ) {
    this.basePath = path.resolve(basePath); // Ensure basePath is absolute
  }

  public async start(): Promise<void> {
    if (this.isWatching) {
      console.log(
        `[FILE_WATCHER] Watcher already active for path: ${this.basePath}`
      );
      // Instead of returning, try to stop and restart
      await this.close();
    }

    if (!window.electronAPI?.fileWatcher) {
      throw new Error('File watcher API not available');
    }

    try {
      // Set up event listeners
      if (!this.hasListeners) {
        window.electronAPI.fileWatcher.onEvent((event) => {
          this.onChange(event);
        });

        window.electronAPI.fileWatcher.onError((error) => {
          console.error(
            `[FILE_WATCHER] Error for path ${this.basePath}:`,
            error
          );
        });
        this.hasListeners = true;
      }

      // Start the watcher
      const result = await window.electronAPI.fileWatcher.start(this.basePath);
      if ('error' in result) {
        throw new Error(`Failed to start file watcher: ${result.error}`);
      }

      this.isWatching = true;
      console.log(
        `[FILE_WATCHER] Successfully started watcher for path: ${this.basePath}`
      );
    } catch (error) {
      // If we fail to start, ensure we're in a clean state
      this.isWatching = false;
      if (this.hasListeners) {
        window.electronAPI.fileWatcher.removeListeners();
        this.hasListeners = false;
      }
      throw error;
    }
  }

  public async close(): Promise<void> {
    console.log(`[FILE_WATCHER] Closing watcher for path: ${this.basePath}`);
    if (!window.electronAPI?.fileWatcher) {
      return;
    }

    try {
      // Stop the watcher first
      if (this.isWatching) {
        const result = await window.electronAPI.fileWatcher.stop(this.basePath);
        if ('error' in result) {
          console.error(
            `[FILE_WATCHER] Error stopping file watcher: ${result.error}`
          );
        }
        this.isWatching = false;
      }

      // Then remove listeners
      if (this.hasListeners) {
        window.electronAPI.fileWatcher.removeListeners();
        this.hasListeners = false;
      }
    } catch (error) {
      console.error(`[FILE_WATCHER] Error during watcher cleanup:`, error);
      // Ensure we're in a clean state even if there's an error
      this.isWatching = false;
      this.hasListeners = false;
    }
  }
}
