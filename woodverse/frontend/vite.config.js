import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/socket.io": "http://localhost:4000",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    maxWorkers: 2,
    // The first test in a file pays for module transform and the catalog fetch, and
    // vitest runs these files in parallel. The 5s default produced intermittent
    // timeouts that did not reproduce when a file ran on its own.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
