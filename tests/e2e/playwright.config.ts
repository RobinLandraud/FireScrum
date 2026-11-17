import { defineConfig } from '@playwright/test';

// Run by scripts/test.sh in Docker, against the test stack (BASE, port 4201 by default).
export default defineConfig({
  testMatch: '**/*.spec.ts',
  // One worker: every test empties the shared database first.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE ?? 'http://localhost:4201',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
});
