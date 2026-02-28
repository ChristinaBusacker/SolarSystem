import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Most tests are pure logic and run in Node. Individual tests can opt into jsdom
    // via `// @vitest-environment jsdom` when they touch `document`.
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts}"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
