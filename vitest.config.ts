import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // The real package throws unless Next.js's bundler swaps it for a no-op,
      // which doesn't happen under Vitest — stub it out for unit tests instead.
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
    },
  },
});
