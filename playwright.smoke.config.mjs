import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/production-smoke.spec.js",
  respectGitIgnore: false,
  timeout: 60_000,
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: true,
  },
});
