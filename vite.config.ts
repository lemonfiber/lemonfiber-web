import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],

  // Without this, Vite resolves Svelte's server build and mount() throws
  // lifecycle_function_unavailable under Vitest.
  resolve: { conditions: ["browser"] },

  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: { output: { entryFileNames: "assets/[name]-[hash].js" } },
  },

  test: {
    // Testing Library cleans up between tests only when afterEach is global.
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,svelte}"],
      exclude: ["src/**/*.test.ts", "src/**/*.stories.ts", "src/main.ts"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 100, statements: 100, branches: 100, functions: 100 },
    },
  },
});
