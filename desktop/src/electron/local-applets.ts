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

    let path = Path.join(uri.host, uri.path);
    if (path.endsWith('/')) {
      return new Response(null, {
        headers: new Headers([['Location', uri.path + 'index.html']]),
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

const IGNORED_DIRS = ['node_modules', 'src'];

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

  // Nested items
  const items = FS.readdirSync(dir, {
    withFileTypes: true,
  })
    .flatMap((entry) => {
      if (!entry.isDirectory() || IGNORED_DIRS.includes(entry.name)) return [];
      return findManifests([...path, entry.name]);
    })
    .filter((a) => typeof a === 'string');

  if (indexHtmlExists) {
    const indexFile = FS.readFileSync(Path.join(dir, 'index.html'), {
      encoding: 'utf8',
    });

    const refersToManifest = indexFile.includes('<link rel="manifest" href="');
    if (!refersToManifest) return items;

    const uri = URI.serialize({
      scheme: SCHEME,
      host: path[0],
      path: [...path.slice(1), ''].join('/'),
    });

    return [...items, uri];
  }

  return items;
}

/* === 🛠️ === */

function ensureAppletsDir() {
  if (!FS.existsSync(APPLETS_DIR)) {
    FS.mkdirSync(APPLETS_DIR, { recursive: true });
    console.log(`Folder created: ${APPLETS_DIR}`);
  }
}
