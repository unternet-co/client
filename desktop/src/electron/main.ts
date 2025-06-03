import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  MessageBoxOptions,
  HeadersReceivedResponse,
} from 'electron';
import path from 'path';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { registerNativeMenuHandler } from './menu';
import type { FSWatcher } from 'chokidar';
import chokidar from 'chokidar';
import * as fs from 'fs/promises';

const isDev = !app.isPackaged;
const AUTOUPDATE_INTERVAL = 3_600_000; // 60 * 60 * 1000

// Configure logging
log.transports.file.level = isDev ? 'debug' : 'info';
autoUpdater.logger = log;

function formatReleaseNotes(
  notes: string | { note: string }[] | undefined
): string {
  if (!notes) return '';
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) return notes.map((n) => n.note).join('\n\n');
  return '';
}

// Configure auto-updater
function setupAutoUpdater() {
  if (isDev) {
    return;
  }

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'unternet-co',
    repo: 'client',
  });

  // Check for updates
  autoUpdater.on('update-downloaded', (info) => {
    const releaseNotes =
      typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map((note) => note.note).join('\n\n')
          : '';

    const dialogOpts: MessageBoxOptions = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message:
        process.platform === 'win32'
          ? releaseNotes
          : info.releaseName || 'A new version is available',
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.',
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (error) => {
    log.error('Error in auto-updater:', error);
  });

  // Store the interval ID so we can clear it if needed
  let autoUpdateIntervalId: NodeJS.Timeout | null = null;

  // Check for updates every hour
  autoUpdateIntervalId = setInterval(() => {
    autoUpdater.checkForUpdates();
  }, AUTOUPDATE_INTERVAL);

  // Initial check
  autoUpdater.checkForUpdates();
}

function createWindow() {
  /* Create the browser window. */

  const win = new BrowserWindow({
    width: 770,
    height: 790,
    // transparent: true,
    // vibrancy: 'under-window',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      preload: path.join(__dirname, 'preload.js'),
      // Add webview-specific permissions
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Enable PDF viewer
      plugins: true,
    },
    // Set icon based on platform
    icon: path.join(
      __dirname,
      process.platform === 'win32'
        ? 'app-icons/client-icon-windows.ico'
        : 'app-icons/client-icon-macOS.png'
    ),
    // only hide the title bar on macOS
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hidden' as const,
          trafficLightPosition: { x: 12, y: 9 },
        }
      : {}),
  });

  // Set a secure Content Security Policy
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:", // Allow images from any HTTPS/HTTP source
      "media-src 'self' data: blob: https: http:", // Also allow media from any HTTPS/HTTP source
      "connect-src 'self' https: http:", // Allow connections to any HTTPS/HTTP source
      "frame-src 'self' file: data: blob: https: http:", // Allow frames and webviews to load from any HTTPS/HTTP source
    ].join('; ');

    // Create a new headers object with our CSP
    const newHeaders = new Map<string, string[]>();
    if (details.responseHeaders) {
      for (const [key, value] of Object.entries(details.responseHeaders)) {
        if (value) {
          newHeaders.set(key, Array.isArray(value) ? value : [value]);
        }
      }
    }
    newHeaders.set('Content-Security-Policy', [csp]);

    callback({
      responseHeaders: Object.fromEntries(newHeaders),
    });
  });

  // For macOS, explicitly set the dock icon
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, 'app-icons/client-icon-macOS.png'));
  }

  /* Handle links */

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url); // Open the URL in the default system browser
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault(); // Prevent navigation
      shell.openExternal(url); // Open the URL in the default system browser
    }
  });

  /* Handle defocus */

  win.on('blur', () => {
    win.webContents.executeJavaScript(`
      document.body.classList.add('blurred');
    `);
  });

  win.on('focus', () => {
    win.webContents.executeJavaScript(`
      document.body.classList.remove('blurred');
    `);
  });

  /* Handle fullscreen */

  win.on('enter-full-screen', () => {
    win.webContents.send('window:enter-fullscreen');
  });

  win.on('leave-full-screen', () => {
    win.webContents.send('window:leave-fullscreen');
  });

  /* Load web content */

  console.log('Dev mode: ', isDev);
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/www/index.html'));
  }
}

ipcMain.handle('fetch', async (event, url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
});

// Handler to check if the window is in fullscreen mode
ipcMain.handle('isFullScreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isFullScreen() : false;
});

// Add IPC handler for file dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
  // Make sure to get the window from the event sender if needed for modality
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const result = await dialog.showOpenDialog(win, options);
    return result;
  }
  // Fallback if no window is associated (though typically there should be)
  const result = await dialog.showOpenDialog(options);
  return result;
});

// Add IPC handler for message box
ipcMain.handle('show-message-box', async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const result = await dialog.showMessageBox(win, options);
    return { response: result.response };
  }
  // Fallback if no window is associated
  const result = await dialog.showMessageBox(options);
  return { response: result.response };
});

// Add IPC handlers for file watching
const fileWatchers = new Map<string, FSWatcher>();

// Helper function to cleanup watchers
async function cleanupWatcher(normalizedPath: string): Promise<void> {
  console.log(`[FILE_WATCHER] Starting cleanup for path: ${normalizedPath}`);
  const watcher = fileWatchers.get(normalizedPath);
  if (watcher) {
    try {
      // Remove all listeners first
      watcher.removeAllListeners();

      // Then close the watcher
      await watcher.close();
      fileWatchers.delete(normalizedPath);
      console.log(
        `[FILE_WATCHER] Successfully cleaned up watcher for path: ${normalizedPath}`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(
        `[FILE_WATCHER] Error cleaning up watcher for path ${normalizedPath}:`,
        errorMessage
      );
      // Even if there's an error, ensure the watcher is removed from the map
      fileWatchers.delete(normalizedPath);
      // Try to remove listeners one more time
      try {
        watcher.removeAllListeners();
      } catch (e) {
        console.error(
          `[FILE_WATCHER] Error removing listeners during cleanup:`,
          e
        );
      }
    }
  } else {
    console.log(`[FILE_WATCHER] No watcher found for path: ${normalizedPath}`);
  }
}

ipcMain.handle('file-watcher:start', async (event, basePath: string) => {
  const normalizedPath = path.resolve(basePath);
  console.log(`[FILE_WATCHER] Starting watcher for path: ${normalizedPath}`);

  // Always try to cleanup any existing watcher first
  await cleanupWatcher(normalizedPath);

  try {
    // Double check that no watcher exists
    if (fileWatchers.has(normalizedPath)) {
      console.error(
        `[FILE_WATCHER] Watcher still exists after cleanup for path: ${normalizedPath}`
      );
      await cleanupWatcher(normalizedPath); // Try one more time
      if (fileWatchers.has(normalizedPath)) {
        throw new Error('Watcher still exists after cleanup attempts');
      }
    }

    const watcher = chokidar.watch(normalizedPath, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /node_modules/,
        /.git/,
        /dist/,
        /build/,
      ],
      persistent: true,
      ignoreInitial: true,
      atomic: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    // Set up event handlers
    watcher
      .on('add', (filePath: string | null | undefined) => {
        if (!filePath) {
          console.error(
            '[FILE_WATCHER] Received null or undefined filePath in add event'
          );
          return;
        }
        const relativePath = path.relative(normalizedPath, filePath);
        event.sender.send('file-watcher:event', {
          type: 'add',
          path: relativePath,
        });
      })
      .on('change', (filePath: string | null | undefined) => {
        if (!filePath) {
          console.error(
            '[FILE_WATCHER] Received null or undefined filePath in change event'
          );
          return;
        }
        const relativePath = path.relative(normalizedPath, filePath);
        event.sender.send('file-watcher:event', {
          type: 'change',
          path: relativePath,
        });
      })
      .on('unlink', (filePath: string | null | undefined) => {
        if (!filePath) {
          console.error(
            '[FILE_WATCHER] Received null or undefined filePath in unlink event'
          );
          return;
        }
        const relativePath = path.relative(normalizedPath, filePath);
        event.sender.send('file-watcher:event', {
          type: 'unlink',
          path: relativePath,
        });
      })
      .on('error', (err: unknown) => {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        console.error(
          `[FILE_WATCHER] Error for path ${normalizedPath}:`,
          errorMessage
        );
        event.sender.send('file-watcher:error', {
          path: normalizedPath,
          error: errorMessage,
        });
        // On error, try to cleanup the watcher
        void cleanupWatcher(normalizedPath).catch(console.error);
      });

    fileWatchers.set(normalizedPath, watcher);
    console.log(
      `[FILE_WATCHER] Successfully started watcher for path: ${normalizedPath}`
    );
    return { success: true };
  } catch (error) {
    console.error('[FILE_WATCHER] Error starting file watcher:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    // Ensure cleanup on error
    await cleanupWatcher(normalizedPath).catch(console.error);
    return { error: errorMessage };
  }
});

ipcMain.handle('file-watcher:stop', async (event, basePath: string) => {
  const normalizedPath = path.resolve(basePath);
  await cleanupWatcher(normalizedPath);
  return { success: true };
});

// Cleanup all watchers when the app is about to quit
app.on('before-quit', async () => {
  console.log('[FILE_WATCHER] Cleaning up all file watchers...');
  const cleanupPromises = Array.from(fileWatchers.keys()).map(cleanupWatcher);
  await Promise.all(cleanupPromises);
  console.log('[FILE_WATCHER] All file watchers cleaned up');
});

// Add IPC handlers for file system operations
ipcMain.handle(
  'fs:readFile',
  async (event, filePath: string, encoding: 'utf8' | 'binary' = 'utf8') => {
    try {
      const content = await fs.readFile(filePath);
      const contentStr = (
        encoding === 'binary'
          ? content.toString('base64')
          : content.toString('utf-8')
      ) as string;
      return { content: contentStr };
    } catch (error) {
      console.error('Error reading file:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return { error: errorMessage };
    }
  }
);

ipcMain.handle(
  'fs:readdir',
  async (event, dirPath: string, withFileTypes: boolean = false) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return {
        success: true,
        entries: entries.map((entry) => ({
          name: entry.name || '', // Ensure name is always a string
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
        })),
      };
    } catch (err) {
      console.error('Error reading directory:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      return { error: errorMessage };
    }
  }
);

ipcMain.handle('fs:stat', async (event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      success: true,
      stats: {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        mtimeMs: stats.mtimeMs,
      },
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: errorMessage };
  }
});

ipcMain.handle('fs:lstat', async (event, filePath: string) => {
  try {
    const stats = await fs.lstat(filePath);
    return {
      success: true,
      stats: {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
        size: stats.size,
        mtimeMs: stats.mtimeMs,
      },
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: errorMessage };
  }
});

// Add IPC handler for opening files with system default application
ipcMain.handle('open-file-with-default', async (event, filePath: string) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error opening file with default application:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: errorMessage };
  }
});

registerNativeMenuHandler(ipcMain);

// ipcMain.on('request-applets', async (event) => {
//   const appletsPath = app.getPath('userData') + '/applets';

//   if (!fs.existsSync(appletsPath)) {
//     fs.mkdirSync(appletsPath, { recursive: true });
//     console.log(`Folder created: ${appletsPath}`);
//   }

//   const filenames = await fs.readdirSync(appletsPath);
//   const appletData = [];

//   for (let filename of filenames) {
//     const fileData = await fs.readFileSync(
//       `${appletsPath}/${filename}`,
//       'utf8'
//     );
//     appletData.push(fileData);
//   }
//   console.log(appletData);
//   mainWindow.webContents.send('applets', appletData);
// });

app.on('ready', () => {
  createWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', app.quit);
