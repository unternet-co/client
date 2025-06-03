import { defineConfig } from 'vite';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  base: isDev ? '/' : './',
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'APP_',
  build: {
    outDir: 'dist/www',
  },
  define: {
    // Provide Node.js globals
    'process.env': {},
    'process.platform': JSON.stringify(process.platform),
    'process.version': JSON.stringify(process.version),
    'process.versions': JSON.stringify(process.versions),
    process: {
      env: {},
      platform: process.platform,
      version: process.version,
      versions: process.versions,
    },
  },
  optimizeDeps: {
    // Include Node.js built-in modules that are used
    include: ['chokidar'],
  },
  resolve: {
    // Provide Node.js built-in modules
    alias: {
      path: 'path-browserify',
      fs: 'browserify-fs',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
});
