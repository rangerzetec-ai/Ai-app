import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [...mochaPlugins(process.env as any), react(), cloudflare()],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      "@cloudflare/workers-types",
      "@cloudflare/vite-plugin",
      "@getmocha/vite-plugins",
      "@cloudflare/unenv",
      "@cloudflare/unenv-preset",
      "unenv",
      "node:*"
    ],
    include: [
      "react",
      "react-dom",
      "react-router",
      "lucide-react",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "zod",
      "hono"
    ],
    force: true
  },
  define: {
    global: "globalThis",
    process: "{}",
    __dirname: JSON.stringify(path.resolve(__dirname)),
  },
  ssr: {
    noExternal: ["three", "@react-three/fiber", "@react-three/drei"]
  }
});
