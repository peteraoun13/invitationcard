import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function copyOvhBackend() {
  return {
    name: "copy-ovh-backend",
    closeBundle() {
      const distDir = resolve("dist");
      const folders = ["api", "uploads"];

      folders.forEach((folder) => {
        const source = resolve(folder);
        const target = resolve(distDir, folder);

        if (existsSync(source)) {
          cpSync(source, target, { recursive: true });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyOvhBackend()],
});
