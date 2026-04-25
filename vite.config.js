// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/DatenBankenApp/DiBufala/", // ajusta esta ruta a la carpeta real donde montaste la app
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: false,
    // singleFork evita timeout de workers en máquinas con recursos limitados (Vitest 4: opción top-level)
    singleFork: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/services/**", "src/components/**", "src/pages/**"],
      exclude: ["src/test/**", "src/assets/**", "src/ejemplos/**"],
    },
  },
});
