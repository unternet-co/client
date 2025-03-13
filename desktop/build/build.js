const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { copyRecursively } = require('./utils.js');

const config = JSON.parse(
  fs.readFileSync(path.join('build', 'config.json'), 'utf8')
);
const isDev = process.env.NODE_ENV !== 'production';

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
    loader: {
      '.html': 'text',
    },
  });

  copyRecursively(config.static_dir, config.out_dir);
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
