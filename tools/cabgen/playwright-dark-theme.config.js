// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for dark theme screenshots
 * This config preserves the website's natural dark theme
 */
export default defineConfig({
  testDir: './tests',
  
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000,
  },
  
  /* Run tests in serial to avoid overwhelming the server */
  fullyParallel: false,
  workers: 1,
  
  retries: 2,
  
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  /* Global test settings - minimal interference with site theme */
  use: {
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 10000,
    ignoreHTTPSErrors: true,
    
    // Don't override any color scheme - let the site use its default
    // colorScheme: undefined, // This allows the site to use its natural theme
  },

  projects: [
    {
      name: 'chromium-dark-theme',
      use: { 
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        reducedMotion: 'reduce',
        // Explicitly don't set colorScheme to preserve site's dark theme
        timezoneId: 'UTC'
      },
    },
  ],

  outputDir: 'test-results/',
});
