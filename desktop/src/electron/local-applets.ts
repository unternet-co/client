import { app, ipcMain, protocol, shell } from 'electron';
import FS from 'node:fs';
import Path from 'node:path';
import * as URI from 'uri-js';
import mime from 'mime';

export const APPLETS_DIR = `${app.getPath('userData')}/applets/`;
export const SCHEME = 'applet+local';

/* === SETUP === */

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      bypassCSP: true,
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

export function setup() {
  protocol.handle(SCHEME, async (request) => {
    const uri = URI.parse(request.url);

    let path = uri.path;
    if (path.endsWith('/')) {
      return new Response(null, {
        headers: new Headers([['Location', path + 'index.html']]),
        status: 308,
      });
    }

    path = Path.join(APPLETS_DIR, path);

    const blob = await FS.openAsBlob(path);
    const typ = mime.getType(path);

    return new Response(blob.stream(), {
      headers: new Headers([['Content-Type', typ]]),
    });
  });
}

/* === DIR === */

ipcMain.handle('local-applets-dir', async (event) => {
  return APPLETS_DIR;
});

ipcMain.handle('open-local-applets-dir', async (event) => {
  ensureAppletsDir();

  await shell.openPath(APPLETS_DIR);
});

/* === LIST === */

ipcMain.handle('list-local-applets', async (event) => {
  console.log('Loading local applets from: ' + APPLETS_DIR);

  ensureAppletsDir();

  const entries = FS.readdirSync(APPLETS_DIR, { withFileTypes: true });

  return entries
    .filter((e) => e.isDirectory() || e.isSymbolicLink())
    .flatMap((e) => findManifests([e.name]))
    .filter((a) => typeof a === 'string');
});

function findManifests(path: string[]): Array<string> {
  const dir = Path.join(APPLETS_DIR, ...path);
  const indexHtmlExists = FS.existsSync(Path.join(dir, 'index.html'));
  const manifestExists = FS.existsSync(Path.join(dir, 'manifest.json'));

  if (!manifestExists || !indexHtmlExists) {
    return FS.readdirSync(dir, {
      withFileTypes: true,
    })
      .flatMap((entry) => {
        if (!entry.isDirectory()) return [];
        return findManifests([...path, entry.name]);
      })
      .filter((a) => typeof a === 'string');
  }

  return [
    URI.serialize({
      scheme: SCHEME,
      host: 'localhost',
      path: [...path, ''].join('/'),
    }),
  ];
}

/* === 🛠️ === */

function ensureAppletsDir() {
  if (!FS.existsSync(APPLETS_DIR)) {
    FS.mkdirSync(APPLETS_DIR, { recursive: true });
    console.log(`Folder created: ${APPLETS_DIR}`);
  }
}
