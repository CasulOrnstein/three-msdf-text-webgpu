import { defineConfig } from "vite";
import path from "path";
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => {
  const isDev = command === "serve"; // true when running `npm run dev`

  if (isDev) {
    // -------------------------------------------------------
    // Example environment (npm run dev)
    // -------------------------------------------------------
    return {
      root: "example",
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
      server: {
        port: 5173,
      },
    };
  }
  
  return {
    build: {
      lib: {
        entry: "src/index.ts",
        name: "three-msdf-text-webgpu",
        formats: ["es"],
        fileName: (_) => `index.js`,
      },
      emptyOutDir: true,
      rollupOptions: { 
        external: ["three", "three/webgpu", "three/tsl"]
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [dts({ rollupTypes: true })],
  };
});