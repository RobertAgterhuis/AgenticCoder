/**
 * E2E Test Configuration
 * 
 * Extends root Jest config with E2E-specific settings.
 */

module.exports = {
  displayName: 'e2e',
  rootDir: '../../',
  testMatch: ['<rootDir>/tests/e2e/scenarios/**/*.test.ts'],
  testTimeout: 60000, // 60 seconds for E2E tests
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts'],
  globalSetup: '<rootDir>/tests/e2e/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/e2e/globalTeardown.ts',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@agents/(.*)$': '<rootDir>/agents/$1',
  },
  testEnvironment: 'node',
  verbose: true,
  // Run E2E tests sequentially to avoid conflicts
  maxWorkers: 1,
};
