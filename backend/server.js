const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./src/config");
const { scoped } = require("./src/logger");
const compareRoutes = require("./src/routes/compare.routes");

const log = scoped("server");

const REPORTS_DIR = path.join(__dirname, "public", "reports");
fs.mkdirSync(REPORTS_DIR, { recursive: true });

const app = express();

app.use(
  helmet({
    // Report screenshots/PDFs are served cross-origin to the frontend dev server.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(morgan(config.env === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));

app.use(
  cors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
  })
);

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many requests — please slow down." },
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mockMode: config.useMockData, timestamp: new Date().toISOString() });
});

app.use("/api", compareRoutes);
app.use("/reports", express.static(REPORTS_DIR, { maxAge: "1h" }));

app.use((req, res) => {
  res.status(404).json({ error: "not_found", message: "That route doesn't exist." });
});

// Centralized error handler — keeps stack traces out of API responses.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  log.error("Unhandled error", err);
  res.status(500).json({ error: "internal_error", message: "Something went wrong on our end." });
});

app.listen(config.port, () => {
  log.info(`Caburé API listening on port ${config.port} (env=${config.env})`);
  log.info(`Mock data mode: ${config.useMockData ? "ON (sample fares)" : "OFF (live scraping)"}`);
});
