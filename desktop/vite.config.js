import { defineConfig } from 'vite';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'APP_',
  build: {
    outDir: 'dist/www',
  },
});
