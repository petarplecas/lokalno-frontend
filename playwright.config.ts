import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  retries: 0,
  timeout: 15000,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: [['html'], ['line']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
