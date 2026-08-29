import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDirectory = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
});

export default defineConfig({
  fullyParallel: false,
  globalSetup: './global-setup.ts',
  testDir: testDirectory,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
});
