const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const config = require("../config");
const { scoped } = require("../logger");
const { launchBrowser } = require("../scrapers/browser");
const { getUber } = require("../scrapers/uber.scraper");
const { getOla } = require("../scrapers/ola.scraper");
const { getMeru } = require("../scrapers/meru.scraper");
const { getMap } = require("../scrapers/map.scraper");

const log = scoped("report-service");

const REPORTS_DIR = path.join(__dirname, "..", "..", "public", "reports");
const MOCK_DATA = require("../data/mock-fares.json");

function ensureReportsDir(reportId) {
  const dir = path.join(REPORTS_DIR, reportId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Runs the full fare comparison for a source/destination pair.
 *
 * When config.useMockData is true, this returns realistic sample data
 * instantly instead of opening a real browser — handy for local frontend
 * development and demos, and as a safety net since Uber/Ola/Meru's public
 * pages change their markup often enough to break selector-based scraping
 * without warning.
 */
async function buildComparisonReport(source, destination) {
  const reportId = uuid();
  const reportDir = ensureReportsDir(reportId);

  if (config.useMockData) {
    log.info(`USE_MOCK_DATA is on — serving sample fares for report ${reportId}`);
    return {
      reportId,
      source,
      destination,
      generatedAt: new Date().toISOString(),
      mock: true,
      route: MOCK_DATA.route,
      fares: MOCK_DATA.fares,
      mapScreenshotFile: null,
    };
  }

  const browser = await launchBrowser();
  try {
    const screenshotPath = path.join(reportDir, "map.png");

    log.info(`Fetching route for report ${reportId}`);
    const route = await getMap(source, destination, browser, screenshotPath);

    log.info(`Fetching provider fares for report ${reportId}`);
    const [uberDetails, olaDetails, meruDetails] = await Promise.all([
      getUber(source, destination, browser),
      getOla(source, destination, browser),
      getMeru(source, destination, browser),
    ]);

    const fares = [
      { Service: "Uber", Details: uberDetails },
      { Service: "Ola", Details: olaDetails },
      { Service: "Meru", Details: meruDetails },
    ];

    const mapScreenshotFile = fs.existsSync(screenshotPath) ? "map.png" : null;

    return {
      reportId,
      source,
      destination,
      generatedAt: new Date().toISOString(),
      mock: false,
      route,
      fares,
      mapScreenshotFile,
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { buildComparisonReport, REPORTS_DIR };
