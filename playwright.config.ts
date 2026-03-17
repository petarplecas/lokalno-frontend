import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  timeout: 60000,
  workers: 1,
  reporter: [['html'], ['line']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      // Admin is a desktop-only feature; skip on mobile to avoid
      // concurrent login issues with token family revocation
      testIgnore: '**/admin-flow.spec.ts',
    },
  ],
});
