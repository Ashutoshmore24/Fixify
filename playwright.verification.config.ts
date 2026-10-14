import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'email-verification.spec.ts',
  timeout: 30000,
  workers: 1,
  use: { baseURL: 'http://localhost:15175', ...devices['Pixel 5'], channel: 'chrome', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run dev --workspace=client -- --port 15175 --strictPort',
    url: 'http://localhost:15175',
    reuseExistingServer: false,
    env: { VITE_AUTH_MODE: 'firebase', VITE_API_BASE_URL: '/api/v1' },
  },
});
