const path = require("path");
const { buildComparisonReport } = require("../services/report.service");
const { generateReportPdf } = require("../services/pdf.service");
const { sendReportEmail } = require("../services/email.service");
const { scoped } = require("../logger");

const log = scoped("compare-controller");

const MAX_PLACE_LENGTH = 200;

function validatePlace(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    return `${fieldName} is required.`;
  }
  if (value.length > MAX_PLACE_LENGTH) {
    return `${fieldName} must be under ${MAX_PLACE_LENGTH} characters.`;
  }
  return null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * POST /api/compare
 * Body: { source: string, destination: string, email?: string }
 *
 * Runs (or mocks) the fare comparison, generates a PDF report, optionally
 * emails it, and returns everything the frontend needs to render results.
 */
async function compareFares(req, res) {
  const { source, destination, email } = req.body || {};

  const sourceError = validatePlace(source, "Source");
  const destinationError = validatePlace(destination, "Destination");
  if (sourceError || destinationError) {
    return res.status(400).json({
      error: "validation_error",
      message: [sourceError, destinationError].filter(Boolean).join(" "),
    });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: "validation_error", message: "Email address is invalid." });
  }

  try {
    log.info(`Comparing fares: "${source}" -> "${destination}"`);
    const report = await buildComparisonReport(source.trim(), destination.trim());

    const reportDir = path.join(__dirname, "..", "..", "public", "reports", report.reportId);
    const pdfPath = await generateReportPdf(report, reportDir);

    let emailResult = null;
    if (email) {
      emailResult = await sendReportEmail(email, pdfPath, report).catch((err) => {
        log.error("Email send failed", err.message);
        return { sent: false, reason: "send_failed" };
      });
    }

    return res.json({
      reportId: report.reportId,
      source: report.source,
      destination: report.destination,
      generatedAt: report.generatedAt,
      mock: report.mock,
      route: report.route,
      fares: report.fares,
      mapScreenshotUrl: report.mapScreenshotFile
        ? `/reports/${report.reportId}/${report.mapScreenshotFile}`
        : null,
      pdfUrl: `/reports/${report.reportId}/report.pdf`,
      email: emailResult,
    });
  } catch (err) {
    log.error("Failed to build comparison report", err);
    return res.status(502).json({
      error: "scrape_failed",
      message:
        "We couldn't fetch live fares right now — the provider sites may be temporarily " +
        "unavailable or may have changed their page layout. Please try again shortly.",
    });
  }
}

module.exports = { compareFares };
