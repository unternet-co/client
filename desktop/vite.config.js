import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  publicDir: 'static',
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'APP_',
});
