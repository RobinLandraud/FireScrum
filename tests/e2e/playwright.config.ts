import { defineConfig } from '@playwright/test';

// Run by the e2e service of docker-compose.test.yml (scripts/test.sh), against the test stack.
export default defineConfig({
  testMatch: '**/*.spec.ts',
  // One worker: every test empties the shared database first.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE,
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
});
