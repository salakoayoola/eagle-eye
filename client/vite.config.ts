import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/fs": {
        target: process.env.VITE_COPYPARTY_URL || "http://localhost:3923",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fs/, ""),
      },
      "/api/drives": {
        target: process.env.VITE_COMPANION_URL || "http://localhost:3924",
        changeOrigin: true,
      },
    },
  },
});
