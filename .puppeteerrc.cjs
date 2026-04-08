const { join } = require("path");

/**
 * Keep Puppeteer's browser cache inside the project so Render's built image
 * carries the downloaded Chrome binary into runtime.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
