import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    maxWorkers: 2,
    minWorkers: 1,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./test/setup.ts'],
  },
});
