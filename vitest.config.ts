import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
    coverage: { reporter: ['text', 'lcov'], include: ['packages/*/src/**'] },
  },
});
