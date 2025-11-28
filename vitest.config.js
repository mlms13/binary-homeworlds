import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/*/src/**/*.{test,spec}.{js,ts,tsx}',
      '**/__tests__/**/*.{js,ts,tsx}',
    ],
    exclude: [
      '**/__tests__/**/utils.{js,ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/__tests__/**',
        '**/__test__/**',
        'dist/',
        'coverage/',
      ],
    },
  },
});
