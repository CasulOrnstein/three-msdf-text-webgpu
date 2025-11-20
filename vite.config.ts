import { defineConfig } from "vite";
import path from "path";
import dts from 'vite-plugin-dts';

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";
  const isGh = mode === "ghpages";

  if (isDev) {
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

  if (isGh) {
    return {
      root: "example",
      publicDir: "public",
      base: "/three-msdf-text-webgpu/",
      build: {
        outDir: "../dist-gh",   // build example site
        emptyOutDir: true,
      },
      resolve: {
        alias: { "@": path.resolve(__dirname, "./src") },
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