import { app, protocol } from 'electron';
import fs from 'node:fs';

export const APPLETS_DIR = `${app.getPath('userData')}/applets/`;

/* === SETUP === */

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'applet+local',
    privileges: {
      supportFetchAPI: true,
    },
  },
]);

export function setup() {
  protocol.handle('applet+local', (request) => {
    const path = request.url;
    console.log('🔮', path);
    return new Response(`TODO`);
  });
}

/* === 🛠️ === */

function ensureAppletsDir() {
  if (!fs.existsSync(APPLETS_DIR)) {
    fs.mkdirSync(APPLETS_DIR, { recursive: true });
    console.log(`Folder created: ${APPLETS_DIR}`);
  }
}
