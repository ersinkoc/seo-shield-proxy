import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    setupFiles: ['./tests/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'node_modules', 'dist'],
      thresholds: {
        global: {
          branches: 10,
          functions: 15,
          lines: 15,
          statements: 15
        }
      }
    },
    timeout: 30000,
    bail: 0,
    testTimeout: 30000,
    hookTimeout: 30000,
    isolate: true,
    watch: false,
    reporter: 'verbose',
    passWithNoTests: false,
    sequence: {
      shuffle: false
    }
  },
  esbuild: {
    target: 'node18'
  }
});
