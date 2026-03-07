import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Read the cabinets from JSON file
const cabinetsPath = path.join(__dirname, "..", "cabinets.json");
const cabinets = JSON.parse(fs.readFileSync(cabinetsPath, "utf8"));

test.describe("Cabinet Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the website before each test
    await page.goto("https://aitumap.remoodle.app");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");
  });

  // Create a test for each cabinet
  for (const cabinet of cabinets) {
    test(`Take screenshot for cabinet ${cabinet}`, async ({ page }) => {
      // Find the search input field
      const searchInput = page.locator("#search__chakra-input");

      // Wait for the input to be visible
      await expect(searchInput).toBeVisible();

      // Clear any existing value and enter the cabinet name
      await searchInput.click();
      await searchInput.selectText();
      await searchInput.type(cabinet);

      // Optional: Press Enter to trigger search or wait a moment for results
      await searchInput.press("Enter");

      // Wait a moment for any search results or map updates
      await page.waitForTimeout(2000);

      // Temporarily hide UI elements for the screenshot
      await page.evaluate(() => {
        const searchDiv = document.querySelector(".search");
        const drawerButton = document.querySelector("#drawer-state__open");
        const drawerLabel = document.querySelector('label[for="drawer-state"]');

        if (searchDiv) searchDiv.style.visibility = "hidden";
        if (drawerButton) drawerButton.style.display = "none";
        if (drawerLabel) drawerLabel.style.display = "none";
      });

      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(__dirname, "..", "screenshots");
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      // Take screenshot with cabinet name as filename
      const filename = `${cabinet.replace(/[/\\?%*:|"<>]/g, "-")}.png`;
      const screenshotPath = path.join(screenshotsDir, filename);

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
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

      console.log(`Screenshot saved for cabinet ${cabinet}: ${filename}`);
    });
  }
});

// Alternative approach: Single test that iterates through all cabinets
test.describe("Cabinet Screenshots - Batch Processing", () => {
  test("Take screenshots for all cabinets", async ({ page }) => {
    // Navigate to the website
    await page.goto("https://aitumap.remoodle.app");
    await page.waitForLoadState("networkidle");

    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, "..", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Find the search input field once
    const searchInput = page.locator("#search__chakra-input");
    await expect(searchInput).toBeVisible();

    // Iterate through all cabinets
    for (let i = 0; i < cabinets.length; i++) {
      const cabinet = cabinets[i];

      console.log(`Processing cabinet ${i + 1}/${cabinets.length}: ${cabinet}`);

      // Clear and enter cabinet name
      await searchInput.click();
      await searchInput.selectText();
      await searchInput.type(cabinet);
      await searchInput.press("Enter");

      // Wait for search results/map update
      await page.waitForTimeout(2000);

      // Temporarily hide UI elements for the screenshot
      await page.evaluate(() => {
        const searchDiv = document.querySelector(".search");
        const drawerButton = document.querySelector("#drawer-state__open");
        const drawerLabel = document.querySelector('label[for="drawer-state"]');

        if (searchDiv) searchDiv.style.visibility = "hidden";
        if (drawerButton) drawerButton.style.display = "none";
        if (drawerLabel) drawerLabel.style.display = "none";
      });

      // Take screenshot
      const filename = `${cabinet.replace(/[/\\?%*:|"<>]/g, "-")}.png`;
      const screenshotPath = path.join(screenshotsDir, filename);

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Restore UI elements for next iteration
      await page.evaluate(() => {
        const searchDiv = document.querySelector(".search");
        const drawerButton = document.querySelector("#drawer-state__open");
        const drawerLabel = document.querySelector('label[for="drawer-state"]');

        if (searchDiv) searchDiv.style.visibility = "";
        if (drawerButton) drawerButton.style.display = "";
        if (drawerLabel) drawerLabel.style.display = "";
      });

      console.log(`✓ Screenshot saved: ${filename}`);

      // Small delay between iterations to be respectful to the server
      await page.waitForTimeout(500);
    }

    console.log(`Completed! Generated ${cabinets.length} screenshots.`);
  });
});
