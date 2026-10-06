import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Pixel 5'], // Mobile viewport by default (393 x 851)
  },
  webServer: [
    {
      command: 'npm run dev --workspace=server',
      url: 'http://localhost:5000/health',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'npm run dev --workspace=client',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
