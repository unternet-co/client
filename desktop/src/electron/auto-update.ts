import { app, dialog, MessageBoxOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

const isDev = !app.isPackaged;
const AUTOUPDATE_INTERVAL = 3_600_000; // 60 * 60 * 1000

/* === LOGGING === */

autoUpdater.logger = log;

/* === SETUP === */

export function setup() {
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
      message: process.platform === 'win32' ? releaseNotes : info.releaseName,
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
