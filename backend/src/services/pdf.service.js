const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const config = require("../config");
const { scoped } = require("../logger");

const log = scoped("pdf-service");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderReportHtml(report) {
  const rows = ["Bike", "Auto", "Hatchback", "Sedan", "SUV"]
    .map((type) => {
      const cells = report.fares
        .map((service) => {
          const detail = service.Details.find((d) => d.Type === type);
          const fare = detail ? detail.Fare : "NOT AVAILABLE";
          return `<td>${fare === "NOT AVAILABLE" ? "—" : `₹${escapeHtml(fare)}`}</td>`;
        })
        .join("");
      return `<tr><td class="type-cell">${type}</td>${cells}</tr>`;
    })
    .join("");

  const serviceHeaders = report.fares.map((s) => `<th>${escapeHtml(s.Service)}</th>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 32px; }
  h1 { color: #14171c; margin-bottom: 0; }
  .subtitle { color: #666; margin-top: 4px; }
  .route-box { background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
  th { background: #14171c; color: #fff; }
  .type-cell { font-weight: bold; background: #f4f4f4; }
  .footer { margin-top: 24px; font-size: 12px; color: #888; }
</style>
</head>
<body>
  <h1>Caburé — Fare Comparison</h1>
  <p class="subtitle">Generated ${escapeHtml(new Date(report.generatedAt).toLocaleString())}</p>

  <div class="route-box">
    <p><strong>From:</strong> ${escapeHtml(report.source)} &nbsp;→&nbsp; <strong>To:</strong> ${escapeHtml(report.destination)}</p>
    <p><strong>Duration:</strong> ${escapeHtml(report.route.duration)} &nbsp;|&nbsp; <strong>Distance:</strong> ${escapeHtml(report.route.distance)}</p>
    <p><strong>Route:</strong> ${escapeHtml(report.route.route)}</p>
    ${report.route.trafficNote ? `<p>${escapeHtml(report.route.trafficNote)}</p>` : ""}
  </div>

  <table>
    <thead><tr><th>Vehicle</th>${serviceHeaders}</tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <p class="footer">Fares are live estimates scraped from each provider's public pages and can change by
  the time you book. Caburé is not affiliated with Uber, Ola, or Meru.</p>
</body>
</html>`;
}

/**
 * Renders a comparison report to a PDF file and returns its path.
 * Uses a fresh headless Chromium instance (kept separate from the scraping
 * browser) so PDF generation never competes with an in-flight scrape.
 */
async function generateReportPdf(report, outputDir) {
  const outputPath = path.join(outputDir, "report.pdf");
  const html = renderReportHtml(report);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const tab = await browser.newPage();
    await tab.setContent(html, { waitUntil: "load" });
    await tab.pdf({ path: outputPath, format: "A4", printBackground: true });
    log.info(`Report PDF written to ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { generateReportPdf };
