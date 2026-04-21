import path from "node:path";
import { promises as fsp, createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "..", "dist");

const extensionSrcDir = path.join(__dirname, "..", "src");
const srcZipOutputPath = path.join(distPath, "remext.zip");

const flush = async () => {
  try {
    await fsp.rm(distPath, { recursive: true, force: true });
    await fsp.mkdir(distPath);
    console.log("[flush] Directory flushed and recreated successfully.");
  } catch (err) {
    console.error("[flush] Failed to flush and recreate the directory:", err);
  }
};

const bundle = async () => {
  try {
    const srcZipOutput = createWriteStream(srcZipOutputPath);
    const srcZipArchive = archiver("zip", { zlib: { level: 9 } });

    srcZipArchive.pipe(srcZipOutput);
    srcZipArchive.directory(extensionSrcDir, false);
    await srcZipArchive.finalize();

    console.log("[bundle] Bundling complete.");
  } catch (err) {
    console.error("[bundle] An error occurred:", err);
  }
};

const createIndexHtml = async () => {
  const indexPath = path.join(distPath, "index.html");
  const buildDate = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReMoodle Extension</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #fff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
        }
        h1 {
            color: #333;
            font-size: 2rem;
            margin-bottom: 1rem;
            text-align: center;
        }
        .build-date {
            text-align: center;
            color: #666;
            font-size: 1rem;
            margin-bottom: 2rem;
            padding: 10px;
            background: #f5f5f5;
        }
        .download-section {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #ddd;
        }
        .download-link {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            margin: 10px 0;
            font-weight: 600;
        }
        .download-link:hover {
            background: #0056b3;
        }
        .file-info {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
        .instructions-section {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid #ddd;
        }
        ol {
            margin: 10px 0 0 20px;
            padding: 0;
        }
        li {
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ReMoodle Extension</h1>
        <div class="build-date">Built on ${buildDate}</div>
        
        <div class="download-section">
            <h2 style="margin-top:0;">Extension Package</h2>
            <p>Download the Chrome extension package:</p>
            <a href="remext.zip" class="download-link" download>
                Download Extension (ZIP)
            </a>
            <div class="file-info">Ready-to-install Chrome extension package</div>
        </div>

        <div class="instructions-section">
            <h2 style="margin-top:0;">Installation Instructions</h2>
            <ol>
                <li>Download the extension ZIP file above</li>
                <li>Extract the ZIP file to a folder</li>
                <li>Open Chrome and go to <code>chrome://extensions/</code></li>
                <li>Enable <b>Developer mode</b> in the top right</li>
                <li>Click <b>Load unpacked</b> and select the extracted folder</li>
            </ol>
        </div>
    </div>
</body>
</html>`;

  await fsp.writeFile(indexPath, htmlContent);
  console.log("[index] Index.html created successfully.");
};

const build = async () => {
  await flush();
  await bundle();
  await createIndexHtml();
  console.log("[build] Build complete. Files output to dist folder.");
};

build();
