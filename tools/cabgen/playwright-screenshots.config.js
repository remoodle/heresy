// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration optimized for screenshot automation
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  // Screenshot-specific settings
  timeout: 60000, // 60 seconds per test (increased for screenshot processing)
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  /* Run tests in serial for screenshot automation to avoid overwhelming the server */
  fullyParallel: false,
  workers: 1, // Use only 1 worker to avoid rate limiting
  
  /* Retry failed tests */
  retries: 2,
  
  /* Reporter configuration */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  /* Global test settings */
  use: {
    /* Browser context options */
    viewport: { width: 1920, height: 1080 }, // Full HD for screenshots
    
    /* Screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording (disable for performance) */
    video: 'off',
    
    /* Tracing (disable for performance during bulk screenshots) */
    trace: 'retain-on-failure',
    
    /* Network settings */
    navigationTimeout: 30000, // 30 seconds for page navigation
    actionTimeout: 10000, // 10 seconds for actions
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* User agent */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },

  /* Browser projects - optimized for screenshots */
  projects: [
    {
      name: 'chromium-screenshots',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional settings for consistent screenshots
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        // Disable animations for consistent screenshots
        reducedMotion: 'reduce',
        // Force dark theme to match site's default
        colorScheme: 'dark',
        // Set a consistent timezone
        timezoneId: 'UTC'
      },
    },
    
    // Uncomment if you want to test on Firefox as well
    // {
    //   name: 'firefox-screenshots',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     deviceScaleFactor: 1,
    //     reducedMotion: 'reduce',
    //     colorScheme: 'light',
    //     timezoneId: 'UTC'
    //   },
    // },
    
    // Mobile viewport for mobile screenshots (optional)
    // {
    //   name: 'mobile-screenshots',
    //   use: { 
    //     ...devices['iPhone 12'],
    //     // Mobile-specific screenshot settings
    //   },
    // },
  ],

  /* Output directories */
  outputDir: 'test-results/',
  
  /* Global setup and teardown */
  // globalSetup: './global-setup.js',
  // globalTeardown: './global-teardown.js',
});
