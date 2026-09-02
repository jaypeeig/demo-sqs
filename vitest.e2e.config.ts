import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.e2e.test.ts"],
    environment: "node",
    globalSetup: ["tests/e2e/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // One shared queue - keep test files from racing each other over it.
    fileParallelism: false,
  },
});
