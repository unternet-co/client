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
});
