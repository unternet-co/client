import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'APP_',
  build: {
    outDir: 'dist/www',
  },
});
