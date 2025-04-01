import { app, BrowserWindow, shell, ipcMain, dialog, MessageBoxOptions } from 'electron';
import path from 'path';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

const isDev = process.env.NODE_ENV !== "production";

// Configure logging
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = isDev ? 'debug' : 'info';

function formatReleaseNotes(notes: string | { note: string }[] | undefined): string {
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) return notes.map(n => n.note).join('\n\n');
  return '';
}



// Configure auto-updater
function setupAutoUpdater() {
  if (isDev) {
    return;
  }

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: "unternet-co",
    repo: "client",
  });
  
  
  // Check for updates
  autoUpdater.on('update-downloaded', (info) => {
    const releaseNotes =
    typeof info.releaseNotes === 'string'
      ? info.releaseNotes
      : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map(note => note.note).join('\n\n')
        : '';
  
      const dialogOpts: MessageBoxOptions = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : info.releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
      };
        
    
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
  });
  
  autoUpdater.on('error', (error) => {
    log.error('Error in auto-updater:', error);
  });
  
  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);
  
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
      preload: path.join(__dirname, "preload.js"),
    },
    // frame: false,
    // only hide the title bar on macOS
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hidden",
          trafficLightPosition: { x: 12, y: 9 },
        }
      : {}),
  });

  /* Handle links */

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url); // Open the URL in the default system browser
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault(); // Prevent navigation
      shell.openExternal(url); // Open the URL in the default system browser
    }
  });

  /* Handle defocus */

  win.on("blur", () => {
    win.webContents.executeJavaScript(`
      document.body.classList.add('blurred');
    `);
  });

  win.on("focus", () => {
    win.webContents.executeJavaScript(`
      document.body.classList.remove('blurred');
    `);
  });

  /* Handle fullscreen */

  win.on("enter-full-screen", () => {
    win.webContents.send("window:enter-fullscreen");
  });

  win.on("leave-full-screen", () => {
    win.webContents.send("window:leave-fullscreen");
  });

  /* Load web content */

  console.log("Dev mode: ", isDev);
  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "index.html"));
  }
}

ipcMain.handle("fetch", async (event, url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
});

// Handler to check if the window is in fullscreen mode
ipcMain.handle("isFullScreen", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isFullScreen() : false;
});

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
