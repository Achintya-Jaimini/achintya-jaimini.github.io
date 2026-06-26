const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const MIN_SUBMIT_TIME_MS = 1200;

const buckets = new Map();

function checkFormGuard(req, formName, fields = {}) {
  const trap = cleanValue(fields.website || fields.companyWebsite);

  if (trap) {
    return {
      ok: false,
      statusCode: 200,
      payload: {
        ok: true,
        message: "Thanks. Your message has been received.",
      },
    };
  }

  const startedAt = Number(fields.formStartedAt);

  if (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_SUBMIT_TIME_MS) {
    return {
      ok: false,
      statusCode: 400,
      payload: { error: "Please wait a moment before sending." },
    };
  }

  const rateLimit = checkRateLimit(`${formName}:${getClientIp(req)}`);

  if (!rateLimit.ok) {
    return {
      ok: false,
      statusCode: 429,
      payload: { error: "Too many submissions. Please try again later." },
    };
  }

  return { ok: true };
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "";
}

function checkRateLimit(key) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { ok: true };
  }

  bucket.count += 1;

  return { ok: bucket.count <= RATE_LIMIT_MAX_REQUESTS };
}

function cleanValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  checkFormGuard,
  getClientIp,
};
