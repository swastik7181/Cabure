require("dotenv").config();

/**
 * Parses a comma-separated env var into a trimmed array, ignoring blanks.
 */
function parseList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBool(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  corsOrigins: parseList(process.env.CORS_ORIGIN),

  useMockData: parseBool(process.env.USE_MOCK_DATA, true),
  headless: parseBool(process.env.HEADLESS, true),
  navigationTimeoutMs: Number(process.env.NAVIGATION_TIMEOUT_MS) || 45000,
  scrapeStepDelayMs: Number(process.env.SCRAPE_STEP_DELAY_MS) || 1500,

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: parseBool(process.env.SMTP_SECURE, true),
    user: process.env.EMAIL_USER || "",
    appPassword: process.env.EMAIL_APP_PASSWORD || "",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || "",
    whatsappTo: process.env.TWILIO_WHATSAPP_TO || "",
  },
};

config.isEmailConfigured = Boolean(config.email.user && config.email.appPassword);
config.isTwilioConfigured = Boolean(config.twilio.accountSid && config.twilio.authToken);

module.exports = config;
