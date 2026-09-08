const nodemailer = require("nodemailer");

const { checkFormGuard, getClientIp } = require("./form-guard.js");

const CONTACT_EMAIL = "achintyajaimini@gmail.com";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://achintyajaimini.github.io",
  "http://localhost:3000",
];

async function handler(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      error: "Method not allowed.",
    });
  }

  try {
    const body = await readJsonBody(req);

    const name = cleanValue(body.name);
    const email = cleanValue(body.email);
    const subject = cleanValue(body.subject) || "Portfolio Contact";
    const message = cleanValue(body.message);

    const guard = checkFormGuard(req, "contact", body);

    if (!guard.ok) {
      return sendJson(res, guard.statusCode, guard.payload);
    }

    if (!name || !email || !message) {
      return sendJson(res, 400, {
        error: "Please complete every field before sending.",
      });
    }

    if (!isValidEmail(email)) {
      return sendJson(res, 400, {
        error: "Please enter a valid email address.",
      });
    }

    const submission = {
      submittedAt: new Date().toISOString(),
      name,
      email,
      subject,
      message,
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"] || "",
    };

    await sendContactEmails(submission);

    return sendJson(res, 200, {
      ok: true,
      emailSent: true,
      message: "Thanks. Your message has been received.",
    });
  } catch (error) {
    console.error("Contact API error:", error);

    return sendJson(res, error.statusCode || 500, {
      error:
        error.publicMessage ||
        "Sorry, your message could not be sent. Please try again.",
    });
  }
}

/**
 * Sends:
 *
 * 1. Notification email to Achintya
 * 2. Confirmation email to the person who submitted the form
 */
async function sendContactEmails(submission) {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = process.env.SMTP_PORT || "465";
  const smtpUser = process.env.SMTP_USER || CONTACT_EMAIL;

  const fromEmail =
    process.env.CONTACT_FROM_EMAIL ||
    `Achintya Jaimini <${smtpUser}>`;

  const toEmail =
    process.env.CONTACT_TO_EMAIL ||
    CONTACT_EMAIL;

  if (!process.env.SMTP_PASS) {
    throw new PublicError(
      "Email delivery is not configured yet. Please check the email settings.",
      "Missing SMTP_PASS.",
      500
    );
  }

  const port = Number(smtpPort);

  if (!Number.isInteger(port)) {
    throw new PublicError(
      "Email delivery is not configured yet. SMTP_PORT must be a number.",
      "SMTP_PORT must be a number.",
      500
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure:
      process.env.SMTP_SECURE === "true" ||
      port === 465,

    auth: {
      user: smtpUser,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    /*
     * EMAIL #1
     * Notification sent to Achintya
     */
    await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      replyTo: submission.email,

      subject: `Portfolio contact: ${submission.subject}`,

      text: formatNotificationPlainText(submission),

      html: formatNotificationHtml(submission),
    });

    /*
     * EMAIL #2
     * Confirmation sent to the person who submitted the form
     */
    await transporter.sendMail({
      from: fromEmail,
      to: submission.email,

      subject: "Thanks for contacting Achintya Jaimini",

      text: formatConfirmationPlainText(submission),

      html: formatConfirmationHtml(submission),
    });
  } catch (error) {
    throw toPublicSmtpError(error);
  }
}

/* =========================
   NOTIFICATION EMAIL
========================= */

function formatNotificationPlainText(submission) {
  return [
    "New portfolio contact form submission",
    "",
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Subject: ${submission.subject}`,
    `Submitted: ${submission.submittedAt}`,
    "",
    "Message:",
    submission.message,
    "",
    `IP Address: ${submission.ipAddress}`,
    `User Agent: ${submission.userAgent}`,
  ].join("\n");
}

function formatNotificationHtml(submission) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>New portfolio contact form submission</h2>

      <p>
        <strong>Name:</strong>
        ${escapeHtml(submission.name)}
      </p>

      <p>
        <strong>Email:</strong>
        ${escapeHtml(submission.email)}
      </p>

      <p>
        <strong>Subject:</strong>
        ${escapeHtml(submission.subject)}
      </p>

      <p>
        <strong>Submitted:</strong>
        ${escapeHtml(submission.submittedAt)}
      </p>

      <hr />

      <p><strong>Message:</strong></p>

      <p>
        ${escapeHtml(submission.message).replace(/\n/g, "<br>")}
      </p>
    </div>
  `;
}

/* =========================
   CONFIRMATION EMAIL
========================= */

function formatConfirmationPlainText(submission) {
  return [
    `Hi ${submission.name},`,
    "",
    "Thank you for contacting Achintya Jaimini.",
    "",
    "I have received your message and will get back to you as soon as possible.",
    "",
    "Your message:",
    `"${submission.message}"`,
    "",
    "Best,",
    "Achintya Jaimini",
    "",
    "https://achintyajaimini.github.io",
  ].join("\n");
}

function formatConfirmationHtml(submission) {
  return `
    <div
      style="
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <h2>Thank you for contacting me</h2>

      <p>
        Hi ${escapeHtml(submission.name)},
      </p>

      <p>
        Thank you for reaching out through my portfolio website.
        I have received your message and will get back to you as soon
        as possible.
      </p>

      <div
        style="
          margin: 24px 0;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        "
      >
        <p>
          <strong>Subject:</strong>
          ${escapeHtml(submission.subject)}
        </p>

        <p>
          <strong>Your message:</strong>
        </p>

        <p>
          ${escapeHtml(submission.message).replace(/\n/g, "<br>")}
        </p>
      </div>

      <p>
        Best,<br />
        <strong>Achintya Jaimini</strong>
      </p>

      <p>
        <a
          href="https://achintyajaimini.github.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          achintyajaimini.github.io
        </a>
      </p>
    </div>
  `;
}

/* =========================
   HELPERS
========================= */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toPublicSmtpError(error) {
  if (
    error?.code === "EAUTH" ||
    error?.responseCode === 534 ||
    error?.responseCode === 535
  ) {
    return new PublicError(
      "The email login was rejected. Please check SMTP_USER and SMTP_PASS.",
      error.message,
      502
    );
  }

  if (
    error?.code === "ECONNECTION" ||
    error?.code === "ETIMEDOUT" ||
    error?.code === "ESOCKET"
  ) {
    return new PublicError(
      "The email server could not be reached. Please check SMTP_HOST, SMTP_PORT, and SMTP_SECURE.",
      error.message,
      502
    );
  }

  return new PublicError(
    "Sorry, your message could not be sent. Please try again.",
    error?.message || "Unknown SMTP error.",
    502
  );
}

function cleanValue(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch {
        reject(
          new PublicError(
            "Invalid request body.",
            "Request body was not valid JSON.",
            400
          )
        );
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;

  res.setHeader(
    "Content-Type",
    "application/json"
  );

  res.end(JSON.stringify(payload));
}

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (!origin) {
    return;
  }

  const allowedOrigins = getAllowedOrigins();

  const allowsAnyOrigin =
    allowedOrigins.includes("*");

  if (
    !allowsAnyOrigin &&
    !allowedOrigins.includes(origin)
  ) {
    return;
  }

  res.setHeader(
    "Access-Control-Allow-Origin",
    allowsAnyOrigin ? "*" : origin
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept"
  );

  res.setHeader(
    "Access-Control-Max-Age",
    "86400"
  );

  res.setHeader("Vary", "Origin");
}

function getAllowedOrigins() {
  return (
    process.env.CONTACT_ALLOWED_ORIGINS ||
    DEFAULT_ALLOWED_ORIGINS.join(",")
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

class PublicError extends Error {
  constructor(
    publicMessage,
    message = publicMessage,
    statusCode = 500
  ) {
    super(message);

    this.publicMessage = publicMessage;
    this.statusCode = statusCode;
  }
}

module.exports = handler;