import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // The stated-limits, stated-prices and standard-fonts tests read every source file, which
    // takes longer than the 5 s default on a loaded machine or runner.
    testTimeout: 30000,
  },
});
