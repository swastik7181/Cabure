const puppeteer = require("puppeteer");
const config = require("../config");
const { scoped } = require("../logger");

const log = scoped("browser");

/** Promise-based sleep helper shared by every scraper. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Launches a single shared Chromium instance for one comparison request.
 * Callers are responsible for closing the returned browser.
 */
async function launchBrowser() {
  log.info(`Launching browser (headless=${config.headless})`);
  return puppeteer.launch({
    headless: config.headless ? "new" : false,
    defaultViewport: { width: 1366, height: 900 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--start-maximized",
    ],
  });
}

/**
 * Opens a new tab with sane defaults: a real-looking user agent (some target
 * sites serve a degraded experience to obvious bots) and a hard navigation
 * timeout so one flaky provider can never hang the whole request.
 */
async function openTab(browser) {
  const tab = await browser.newPage();
  await tab.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  tab.setDefaultNavigationTimeout(config.navigationTimeoutMs);
  tab.setDefaultTimeout(config.navigationTimeoutMs);
  return tab;
}

/**
 * Runs an async scraper step and swallows errors into a warning log so a
 * single selector change on a third-party site degrades gracefully instead
 * of crashing the whole comparison request.
 */
async function safely(label, fn, fallback = null) {
  try {
    return await fn();
  } catch (err) {
    log.warn(`Step failed: ${label} — ${err.message}`);
    return fallback;
  }
}

module.exports = { launchBrowser, openTab, delay, safely };
