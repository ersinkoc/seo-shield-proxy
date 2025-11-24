import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/vitest-setup.test.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0
        }
      }
    },
    timeout: 10000,
    bail: 1,
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    watch: false,
    reporter: 'verbose',
    passWithNoTests: false
  },
  esbuild: {
    target: 'node18'
  }
});