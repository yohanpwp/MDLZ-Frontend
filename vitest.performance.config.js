import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/performance/**/*.test.js'],
    environment: 'jsdom',
    setupFiles: ['src/setupTests.js'],
    globals: true,
    testTimeout: 30000, // 30 seconds for performance tests
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});