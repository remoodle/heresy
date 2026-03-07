import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Configuration
const CONFIG = {
  WEBSITE_URL: "https://aitumap.remoodle.app",
  SEARCH_SELECTOR: "#search__chakra-input",
  WAIT_AFTER_SEARCH: 3000, // Wait 3 seconds after search
  WAIT_BETWEEN_SEARCHES: 1000, // Wait 1 second between searches
  SCREENSHOT_OPTIONS: {
    fullPage: true,
    animations: "disabled", // Disable animations for consistent screenshots
  },
  // Browser context options to preserve site's default theme
  BROWSER_OPTIONS: {
    // Don't override the site's color scheme - let it use its default (dark) theme
    colorScheme: null,
  },
  // Elements to hide before taking screenshots
  HIDE_ELEMENTS_CSS: `
    /* Hide drawer button completely */
    #drawer-state__open { display: none !important; }
    label[for="drawer-state"] { display: none !important; }
    .drawer__open-button { display: none !important; }
    .chakra-button.drawer__open-button { display: none !important; }
    
    /* Hide only the search container visually, but keep input functional */
    .search > .chakra-input { opacity: 0 !important; pointer-events: none !important; }
    .search::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: transparent; z-index: 1000; }
  `,
};

// Read cabinets data
function loadCabinets() {
  const cabinetsPath = path.join(__dirname, "..", "cabinets.json");
  try {
    return JSON.parse(fs.readFileSync(cabinetsPath, "utf8"));
  } catch (error) {
    console.error("Error loading cabinets.json:", error);
    throw error;
  }
}

// Ensure screenshots directory exists
function ensureScreenshotsDirectory() {
  const screenshotsDir = path.join(__dirname, "..", "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log(`Created screenshots directory: ${screenshotsDir}`);
  }
  return screenshotsDir;
}

// Sanitize filename for cross-platform compatibility
function sanitizeFilename(filename) {
  return filename.replace(/[/\\?%*:|"<>.\s]/g, "-");
}

const cabinets = loadCabinets();
console.log(`Loaded ${cabinets.length} cabinets for screenshot automation`);

test.describe("Cabinet Screenshots - Advanced", () => {
  let screenshotsDir;

  test.beforeAll(async () => {
    screenshotsDir = ensureScreenshotsDirectory();
  });

  test("Process all cabinets with error handling", async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(cabinets.length * 10000); // 10 seconds per cabinet

    // Navigate to the website
    console.log(`Navigating to ${CONFIG.WEBSITE_URL}`);
    await page.goto(CONFIG.WEBSITE_URL);
    await page.waitForLoadState("networkidle");

    // Verify search input is available
    const searchInput = page.locator(CONFIG.SEARCH_SELECTOR);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    console.log("Search input field found and ready");

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each cabinet
    for (let i = 0; i < cabinets.length; i++) {
      const cabinet = cabinets[i];
      const progress = `${i + 1}/${cabinets.length}`;

      try {
        console.log(`[${progress}] Processing: ${cabinet}`);

        // Clear and enter cabinet name using double-entry workaround for website bug
        await searchInput.click(); // Focus the input
        await searchInput.selectText(); // Select all text
        await searchInput.type(cabinet); // Type new value (replaces selected text)
        await searchInput.press("Enter");

        // Wait 0.1 second (website bug workaround)
        await page.waitForTimeout(1000);
        // Clear the search field completely, then enter cabinet name again for reliable search
        await searchInput.click();
        await searchInput.clear(); // Actually clear the field

        await searchInput.type(cabinet); // Fill with cabinet name
        await searchInput.press("Enter");

        // Wait for results to load
        await page.waitForTimeout(CONFIG.WAIT_AFTER_SEARCH);

        // Temporarily hide UI elements just for the screenshot
        const hideUIScript = `
          const searchDiv = document.querySelector('.search');
          const drawerButton = document.querySelector('#drawer-state__open');
          const drawerLabel = document.querySelector('label[for="drawer-state"]');
          
          // Store original styles
          const originalSearchStyle = searchDiv ? searchDiv.style.visibility : '';
          const originalDrawerStyle = drawerButton ? drawerButton.style.display : '';
          const originalLabelStyle = drawerLabel ? drawerLabel.style.display : '';
          
          // Hide elements
          if (searchDiv) searchDiv.style.visibility = 'hidden';
          if (drawerButton) drawerButton.style.display = 'none';
          if (drawerLabel) drawerLabel.style.display = 'none';
          
          // Return a function to restore
          window.restoreUI = () => {
            if (searchDiv) searchDiv.style.visibility = originalSearchStyle;
            if (drawerButton) drawerButton.style.display = originalDrawerStyle;
            if (drawerLabel) drawerLabel.style.display = originalLabelStyle;
          };
        `;

        await page.evaluate(hideUIScript);

        // Wait a bit for UI changes to take effect and ensure everything is rendered
        await page.waitForTimeout(1000); // 0.1 second
        // Generate filename and path
        const filename = `${sanitizeFilename(cabinet)}.png`;
        const screenshotPath = path.join(screenshotsDir, filename);

        // Take screenshot
        await page.screenshot({
          path: screenshotPath,
          ...CONFIG.SCREENSHOT_OPTIONS,
        });

        // Restore UI elements for next iteration
        await page.evaluate(() => {
          if (window.restoreUI) window.restoreUI();
        });

        successCount++;
        console.log(`[${progress}] ✓ Success: ${filename}`);

        // Wait between searches to be respectful
        if (i < cabinets.length - 1) {
          await page.waitForTimeout(CONFIG.WAIT_BETWEEN_SEARCHES);
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to process ${cabinet}: ${error.message}`;
        console.error(`[${progress}] ✗ Error: ${errorMsg}`);
        errors.push({ cabinet, error: error.message });

        // Continue with next cabinet even if this one failed
        continue;
      }
    }

    // Summary
    console.log("\n=== SUMMARY ===");
    console.log(`Total cabinets: ${cabinets.length}`);
    console.log(`Successful screenshots: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Screenshots saved to: ${screenshotsDir}`);

    if (errors.length > 0) {
      console.log("\n=== ERRORS ===");
      errors.forEach(({ cabinet, error }) => {
        console.log(`${cabinet}: ${error}`);
      });

      // Save error log
      const errorLogPath = path.join(screenshotsDir, "errors.json");
      fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
      console.log(`Error log saved to: ${errorLogPath}`);
    }

    // Expect at least 80% success rate
    const successRate = successCount / cabinets.length;
    expect(successRate).toBeGreaterThan(0.8);
  });
});

// Individual cabinet tests (useful for debugging specific cabinets)
test.describe("Individual Cabinet Tests", () => {
  // Only run a few cabinets individually for debugging
  const testCabinets = cabinets.slice(0, 3);

  test.beforeEach(async ({ page }) => {
    await page.goto(CONFIG.WEBSITE_URL);
    await page.waitForLoadState("networkidle");
  });

  for (const cabinet of testCabinets) {
    test(`Debug cabinet: ${cabinet}`, async ({ page }) => {
      const searchInput = page.locator(CONFIG.SEARCH_SELECTOR);
      await expect(searchInput).toBeVisible();

      // Clear and enter cabinet name using double-entry workaround for website bug
      await searchInput.click();
      await searchInput.selectText();
      await searchInput.type(cabinet);
      await searchInput.press("Enter");

      // Wait 0.1 second (website bug workaround)
      await page.waitForTimeout(100);

      // Clear the search field completely, then enter cabinet name again for reliable search
      await searchInput.click();
      await searchInput.clear(); // Actually clear the field
      await searchInput.fill(cabinet); // Fill with cabinet name
      await searchInput.press("Enter");

      await page.waitForTimeout(CONFIG.WAIT_AFTER_SEARCH);

      // Temporarily hide UI elements just for the screenshot
      const hideUIScript = `
        const searchDiv = document.querySelector('.search');
        const drawerButton = document.querySelector('#drawer-state__open');
        const drawerLabel = document.querySelector('label[for="drawer-state"]');
        
        if (searchDiv) searchDiv.style.visibility = 'hidden';
        if (drawerButton) drawerButton.style.display = 'none';
        if (drawerLabel) drawerLabel.style.display = 'none';
      `;

      await page.evaluate(hideUIScript);

      // Wait a bit for UI changes to take effect
      await page.waitForTimeout(100); // 0.1 second

      const screenshotsDir = ensureScreenshotsDirectory();
      const filename = `debug-${sanitizeFilename(cabinet)}.png`;
      const screenshotPath = path.join(screenshotsDir, filename);

      await page.screenshot({
        path: screenshotPath,
        ...CONFIG.SCREENSHOT_OPTIONS,
      });

      // Restore UI elements
      await page.evaluate(() => {
        const searchDiv = document.querySelector(".search");
        const drawerButton = document.querySelector("#drawer-state__open");
        const drawerLabel = document.querySelector('label[for="drawer-state"]');

        if (searchDiv) searchDiv.style.visibility = "";
        if (drawerButton) drawerButton.style.display = "";
        if (drawerLabel) drawerLabel.style.display = "";
      });

      console.log(`Debug screenshot saved: ${filename}`);
    });
  }
});
