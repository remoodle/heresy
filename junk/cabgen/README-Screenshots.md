# Cabinet Screenshot Automation

This project automates taking screenshots of cabinet searches on the AITU Map website.

## Files Created

1. **`cabinet-screenshots.spec.js`** - Basic version with two approaches:
   - Individual tests for each cabinet
   - Single test that processes all cabinets

2. **`cabinet-screenshots-advanced.spec.js`** - Advanced version with:
   - Error handling and logging
   - Progress tracking
   - Configurable settings
   - Debug mode for specific cabinets

3. **`playwright-screenshots.config.js`** - Optimized Playwright configuration for screenshot automation
4. **`playwright-dark-theme.config.js`** - Configuration that preserves the site's dark theme
5. **`utils/cabinet_parser.py`** - Python script to fetch and extract cabinet locations from Remoodle API

## Updating Cabinet List

To get the most current list of cabinets from the Remoodle API:

### Using Python Script (Recommended)

```powershell
cd utils
python cabinet_parser.py
```

Or on Windows, simply double-click `run_parser.bat`

This will:

- Fetch all groups from `https://calendar.remoodle.app/api/groups`
- Get schedule for each group
- Extract unique cabinet locations
- Filter and sort them naturally (C1.1.143, C1.1.144, C1.2.124K, etc.)
- Save to `cabinets.json`

### Manual Update

You can also manually edit `cabinets.json` to add/remove specific cabinets.

## Theme Issues

If you notice that screenshots have a white background instead of the expected dark theme, use the dark theme configuration:

```powershell
npm run test:screenshots-dark
```

This happens because Playwright can override the site's color scheme preference. The dark theme config ensures the website uses its natural dark theme.

## How to Run

### Option 1: Basic Screenshot Automation

```powershell
npm run test:screenshots
```

### Option 2: Advanced Screenshot Automation (Recommended)

```powershell
npm run test:screenshots-advanced
```

### Option 2a: Advanced with Dark Theme (Preserves site's dark theme)

```powershell
npm run test:screenshots-dark
```

### Option 3: Debug Mode (Run with Browser Visible)

```powershell
npm run test:headed
```

### Option 4: Run Specific Test

```powershell
npx playwright test cabinet-screenshots-advanced.spec.js --config=playwright-screenshots.config.js
```

## Output

- Screenshots will be saved in the `screenshots/` directory
- Each screenshot is named after the cabinet (e.g., `C1-1-143.png`)
- If there are errors, an `errors.json` file will be created with details

## Features

### Basic Version (`cabinet-screenshots.spec.js`)

- Reads cabinets from `cabinets.json`
- Navigates to the AITU Map website
- Enters each cabinet name in the search field
- Takes a screenshot for each cabinet
- Two test approaches: individual tests vs batch processing

### Advanced Version (`cabinet-screenshots-advanced.spec.js`)

- All features from basic version plus:
- **Error Handling**: Continues processing even if some cabinets fail
- **Progress Tracking**: Shows current progress (e.g., "15/249")
- **Success Rate Validation**: Expects at least 80% success rate
- **Error Logging**: Saves failed cabinets to `errors.json`
- **Configurable Settings**: Easy to adjust timeouts and other parameters
- **Debug Mode**: Test only first 3 cabinets for debugging
- **Filename Sanitization**: Handles special characters in cabinet names
- **UI Element Hiding**: Automatically hides search box and drawer button for cleaner screenshots

## Configuration

The advanced version includes a `CONFIG` object at the top of the file where you can adjust:

```javascript
const CONFIG = {
  WEBSITE_URL: "https://aitumap.remoodle.app",
  SEARCH_SELECTOR: "#search__chakra-input",
  WAIT_AFTER_SEARCH: 3000, // Wait time after search (ms)
  WAIT_BETWEEN_SEARCHES: 1000, // Wait time between searches (ms)
  SCREENSHOT_OPTIONS: {
    fullPage: true,
    animations: "disabled",
  },
  // Elements to hide for cleaner screenshots
  HIDE_ELEMENTS_CSS: `
    .search { visibility: hidden !important; }
    #drawer-state__open { display: none !important; }
    label[for="drawer-state"] { display: none !important; }
    .drawer__open-button { display: none !important; }
    .chakra-button.drawer__open-button { display: none !important; }
  `,
};
```

## Troubleshooting

1. **If tests fail**: Check the `errors.json` file in the screenshots directory
2. **If website is slow**: Increase `WAIT_AFTER_SEARCH` in the config
3. **If getting rate limited**: Increase `WAIT_BETWEEN_SEARCHES` in the config
4. **To debug specific cabinets**: Use the Individual Cabinet Tests section
5. **If search input becomes invisible**: The tests now temporarily hide/restore UI elements for each screenshot to avoid this issue
6. **For consistent dark theme**: Use `npm run test:screenshots-dark` or the updated configs now force dark theme

## UI Element Hiding Strategy

The tests use a temporary hide/restore approach:

1. ✅ Search for cabinet (UI visible)
2. ✅ Wait for results
3. 🙈 Temporarily hide UI elements
4. 📸 Take screenshot
5. 👀 Restore UI elements for next iteration

This ensures the search input remains functional throughout the entire process.

## Playwright Configuration

The `playwright-screenshots.config.js` file is optimized for screenshot automation with:

- Single worker to avoid overwhelming the server
- Consistent viewport size (1920x1080)
- Disabled animations for consistent screenshots
- Extended timeouts for processing large batches
- Dark theme forced for consistency with site's default
- UTC timezone for consistency

## Example Output

```
[1/249] Processing: C1.1.143
[1/249] ✓ Success: C1-1-143.png
[2/249] Processing: C1.1.139
[2/249] ✓ Success: C1-1-139.png
...

=== SUMMARY ===
Total cabinets: 249
Successful screenshots: 247
Failed: 2
Screenshots saved to: C:\Users\Asus\dev\lighthouse\screenshots
```

## Tips

1. Run the advanced version first as it provides better error handling
2. Use debug mode to test with a few cabinets before running the full batch
3. The process will take some time (expect 10-15 minutes for 249 cabinets)
4. Screenshots are taken in full page mode to capture the entire map
5. Files are automatically sanitized to work on Windows/Mac/Linux
