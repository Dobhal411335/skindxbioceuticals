import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  clearMocks: true,
  testTimeout: 30_000,
  maxWorkers: 1,
};

export default config;
