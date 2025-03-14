const { buildBrowser, buildMain } = require('./build.js');
const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const config = JSON.parse(
  fs.readFileSync(path.join('build', 'config.json'), 'utf8')
);

async function watch() {
  await buildMain();
  await buildBrowser();

  const electronPath = path.join('..', 'node_modules', '.bin', 'electron');
  const mainPath = path.join(config.out_dir, 'main.js');

  const electronProcess = spawn(electronPath, [mainPath], { stdio: 'inherit' });

  electronProcess.on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });

  electronProcess.on('exit', (code) => {
    console.log(`Electron exited with code: ${code}`);
    process.exit(0);
  });

  chokidar.watch('src/').on('change', (event, path) => {
    process.stdout.write('Files changed. Rebuilding...');
    buildBrowser();
    process.stdout.write('Done!\n');
  });
}

watch();
