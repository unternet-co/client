import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';

import { registerNativeMenuHandler } from './menu';
import { setup as setupAutoUpdater } from './auto-update';
import { setup as setupLocalApplets } from './local-applets';

const isDev = !app.isPackaged;

/* === LOGGING === */

log.transports.file.level = isDev ? 'debug' : 'info';

/* === WINDOW === */

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
          titleBarStyle: 'hidden',
          trafficLightPosition: { x: 12, y: 9 },
        }
      : {}),
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

/* === IPC MISC === */

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

// Native menu
registerNativeMenuHandler(ipcMain);

/* === APP EVENTS === */

app.on('ready', () => {
  createWindow();
  setupLocalApplets();
  setupAutoUpdater();
});

app.on('window-all-closed', app.quit);
