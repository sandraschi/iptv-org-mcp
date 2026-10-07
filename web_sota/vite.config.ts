import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const frontendPort = Number(process.env.VITE_PORT) || 11241;
// VITE_API_TARGET arrives as a full URL ("http://127.0.0.1:11242") from the
// fleet engine - extract the port, fall back to the backend default.
const apiTarget = process.env.VITE_API_TARGET ?? "";
const apiPortMatch = apiTarget.match(/:(\d+)\s*$/);
const backendPort = apiPortMatch ? Number(apiPortMatch[1]) : 11242;
const backend = `http://127.0.0.1:${backendPort}`;

const proxy = {
  "/api": { target: backend, changeOrigin: true },
  "/docs": { target: backend, changeOrigin: true },
  "/openapi.json": { target: backend, changeOrigin: true },
  "/redoc": { target: backend, changeOrigin: true },
  "/mcp": { target: backend, changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: frontendPort,
    host: "127.0.0.1",
    strictPort: true,
    proxy,
  },
  preview: {
    port: frontendPort,
    host: "127.0.0.1",
    strictPort: true,
    proxy,
  },
});
