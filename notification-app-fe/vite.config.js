import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const appDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(appDir, "..");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    fs: {
      allow: [repoDir],
    },
    proxy: {
      "/evaluation-service": {
        target: "http://4.224.186.213",
        changeOrigin: true,
      },
    },
  },
});
