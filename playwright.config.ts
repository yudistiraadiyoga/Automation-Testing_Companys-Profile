/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import { SITE, SITE_NAME } from './src/config';

/**
 * Struktur project:
 * - chromium       : semua test UI (tests/common + tests/sites/<SITE>)
 * - api            : api.spec.ts (memanggil server sungguhan)
 * - cross browsing : crossBrowsing.spec.ts di Chrome, Firefox, Safari, Edge, Chrome Android, Safari iOS
 *
 * Website yang dites dipilih lewat env SITE (default: yovela), lihat src/config/index.ts.
 * See https://playwright.dev/docs/test-configuration.
 */
const CROSS_BROWSING = /crossBrowsing\.spec\.ts/;
const API = /api\.spec\.ts/;

// Lewati folder test milik website lain: tests/sites/<bukan SITE aktif>/...
const OTHER_SITES = new RegExp(`sites[\\\\/](?!${SITE_NAME}[\\\\/])`);

export default defineConfig({
  testDir: './src/tests',
  testIgnore: [OTHER_SITES],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: SITE.baseUrl,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [API, OTHER_SITES],
    },
    {
      name: 'api',
      testMatch: API,
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: false,
    },

    /* Cross browsing (chromium di atas juga menjalankan crossBrowsing.spec.ts) */
    {
      name: 'firefox',
      testMatch: CROSS_BROWSING,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: CROSS_BROWSING,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      testMatch: CROSS_BROWSING,
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'mobile-chrome',
      testMatch: CROSS_BROWSING,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      testMatch: CROSS_BROWSING,
      use: { ...devices['iPhone 15'] },
    },
  ],
});
