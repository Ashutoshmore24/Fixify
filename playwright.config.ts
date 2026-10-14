import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: 'email-verification.spec.ts',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:15174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...devices['Pixel 5'], // Mobile viewport by default (393 x 851)
    channel: 'chrome',
  },
  webServer: [
    {
      command: 'npx tsx scripts/e2e-server.ts',
      url: 'http://localhost:15001/health',
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'npm run dev --workspace=client -- --port 15174 --strictPort',
      url: 'http://localhost:15174',
      reuseExistingServer: false,
      env: { VITE_AUTH_MODE: 'local', VITE_API_BASE_URL: 'http://localhost:15001/api/v1', VITE_SOCKET_URL: 'http://localhost:15001' },
      timeout: 120000,
    },
  ],
});
