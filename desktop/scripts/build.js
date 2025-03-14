const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = JSON.parse(
  fs.readFileSync(path.join('build', 'config.json'), 'utf8')
);
const isDev = process.env.NODE_ENV !== 'production';

let env = Object.create(null);
for (const key of config.env) {
  env[`process.env.${key}`] = JSON.stringify(process.env[key]);
}

async function buildMain() {
  return esbuild.build({
    entryPoints: [config.main, config.preload],
    bundle: true,
    outdir: 'dist',
    platform: 'node',
    target: 'node16',
    sourcemap: isDev,
    minify: !isDev,
    external: ['electron', 'fsevents'],
  });
}

async function buildBrowser() {
  await esbuild.build({
    entryPoints: [config.renderer], // Adjust to your renderer script
    bundle: true,
    outfile: `${config.out_dir}/${config.renderer_outfile}`,
    platform: 'browser',
    target: 'esnext',
    sourcemap: isDev,
    minify: !isDev,
    define: env,
    loader: {
      '.html': 'text',
      '.svg': 'file',
      '.woff2': 'file',
      '.woff': 'file',
      '.ttf': 'file',
    },
  });

  fs.copyFileSync(
    `${config.in_dir}/index.html`,
    `${config.out_dir}/index.html`
  );
}

async function buildAll() {
  try {
    await buildMain();
    await buildBrowser();
    console.log('Build complete.');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

module.exports = { buildAll, buildMain, buildBrowser };

if (require.main === module) {
  buildAll();
}
