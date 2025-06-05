import { app, ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { IFileService, FileResult } from './file-service.interface';

export class FileService implements IFileService {
  private readonly appDataPath: string;
  private watchers = new Map<string, fs.FSWatcher>();

  constructor() {
    this.appDataPath = app.getPath('userData');
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // Handle each method individually for proper typing
    ipcMain.handle('fileService:read', async (_, filePath: string) =>
      this.read(filePath)
    );
    ipcMain.handle(
      'fileService:write',
      async (_, filePath: string, content: string) =>
        this.write(filePath, content)
    );
    ipcMain.handle('fileService:exists', async (_, filePath: string) =>
      this.exists(filePath)
    );
    ipcMain.handle('fileService:getAppDataPath', async () =>
      this.getAppDataPath()
    );

    // Watch/unwatch need special handling for event sender
    ipcMain.handle('fileService:watch', async (event, filePath: string) =>
      this.setupWatch(event, filePath)
    );
    ipcMain.handle('fileService:unwatch', async (event, filePath: string) =>
      this.removeWatch(event, filePath)
    );
  }

  async read(filePath: string): Promise<FileResult<string>> {
    const fullPath = this.getFullPath(filePath);
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return { success: true, data: content };
  }

  async write(filePath: string, content: string): Promise<FileResult<void>> {
    const fullPath = this.getFullPath(filePath);
    await this.ensureDirectoryExists(path.dirname(fullPath));
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    return { success: true };
  }

  async exists(filePath: string): Promise<FileResult<boolean>> {
    try {
      const fullPath = this.getFullPath(filePath);
      await fs.promises.access(fullPath);
      return { success: true, data: true };
    } catch {
      return { success: true, data: false };
    }
  }

  async watch(filePath: string): Promise<FileResult<void>> {
    // This is called by the proxy but actual watching is handled by setupWatch
    return { success: true };
  }

  async unwatch(filePath: string): Promise<FileResult<void>> {
    // This is called by the proxy but actual unwatching is handled by removeWatch
    return { success: true };
  }

  async getAppDataPath(): Promise<FileResult<string>> {
    return { success: true, data: this.appDataPath };
  }

  private async setupWatch(
    event: Electron.IpcMainInvokeEvent,
    filePath: string
  ): Promise<FileResult<void>> {
    const fullPath = this.getFullPath(filePath);
    const watchKey = `${event.sender.id}-${filePath}`;

    // Close existing watcher if any
    if (this.watchers.has(watchKey)) {
      this.watchers.get(watchKey)?.close();
    }

    // Create new watcher
    const watcher = fs.watch(fullPath, (eventType) => {
      if (eventType === 'change') {
        event.sender.send('fileService:changed', { filePath });
      }
    });

    this.watchers.set(watchKey, watcher);
    return { success: true };
  }

  private async removeWatch(
    event: Electron.IpcMainInvokeEvent,
    filePath: string
  ): Promise<FileResult<void>> {
    const watchKey = `${event.sender.id}-${filePath}`;
    const watcher = this.watchers.get(watchKey);
    if (watcher) {
      watcher.close();
      this.watchers.delete(watchKey);
    }
    return { success: true };
  }

  private getFullPath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.appDataPath, filePath);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  // Cleanup watchers when app closes
  cleanup() {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

let fileService: FileService | null = null;

export function setupFileService() {
  console.log('Setting up file service...');
  if (!fileService) {
    fileService = new FileService();
    console.log('File service created and IPC handlers registered');
  }
  return fileService;
}

export function getFileService() {
  return fileService;
}
