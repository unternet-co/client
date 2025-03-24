import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './', // This is important for the static folder to be served correctly
  publicDir: 'static',
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'APP_',
});
