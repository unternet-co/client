import { defineConfig } from "vite";
import path from "path";

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  base: isDev ? '/' : './',
  publicDir: "static",
  envDir: path.resolve(__dirname, ".."),
  envPrefix: "APP_",
});
