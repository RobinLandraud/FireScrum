import { defineConfig } from '@playwright/test';

// Run by the tests service of docker-compose.test.yml, against the test stack.
// Projects: api (HTTP only, no browser) and e2e (browser); entrypoint.sh maps --back / --front to them.
export default defineConfig({
  // One worker: every test empties the shared database first.
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testDir: 'api' },
    { name: 'e2e', testDir: 'e2e', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
