const nodemailer = require("nodemailer");
const config = require("../config");
const { scoped } = require("../logger");

const log = scoped("email-service");

function buildTransport() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.appPassword,
    },
  });
}

/**
 * Emails the generated PDF report to the given address. No-ops (with a
 * clear log line) if SMTP credentials haven't been configured, so the rest
 * of the app keeps working without email set up.
 */
async function sendReportEmail(toEmail, pdfPath, report) {
  if (!config.isEmailConfigured) {
    log.warn("Email not configured (EMAIL_USER / EMAIL_APP_PASSWORD missing) — skipping send");
    return { sent: false, reason: "email_not_configured" };
  }

  const transport = buildTransport();
  await transport.sendMail({
    from: config.email.user,
    to: toEmail,
    subject: `Caburé fare comparison: ${report.source} → ${report.destination}`,
    text: "Here is your cab fare comparison report. Thanks for using Caburé!",
    attachments: [{ filename: "cabure-report.pdf", path: pdfPath }],
  });

  log.info(`Report emailed to ${toEmail}`);
  return { sent: true };
}

/**
 * Sends a WhatsApp notification via Twilio, if configured. Optional feature
 * kept out of the critical path — failures here never fail the main request.
 */
async function sendWhatsAppNotification(message) {
  if (!config.isTwilioConfigured) {
    log.warn("Twilio not configured — skipping WhatsApp notification");
    return { sent: false, reason: "twilio_not_configured" };
  }

  try {
    // Lazily required so the app runs even if the optional dependency isn't installed.
    const twilio = require("twilio");
    const client = twilio(config.twilio.accountSid, config.twilio.authToken);
    await client.messages.create({
      body: message,
      from: config.twilio.whatsappFrom,
      to: config.twilio.whatsappTo,
    });
    log.info("WhatsApp notification sent");
    return { sent: true };
  } catch (err) {
    log.error("Failed to send WhatsApp notification", err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendReportEmail, sendWhatsAppNotification };
