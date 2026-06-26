const { createReadStream, existsSync, readFileSync } = require("node:fs");
const { stat } = require("node:fs/promises");
const { createServer } = require("node:http");
const path = require("node:path");

loadLocalEnv();

const contactHandler = require("./api/contact.js");

const buildDir = path.join(__dirname, "build");
const port = Number(process.env.PORT) || 3000;

const apiRoutes = [
  ["/api/contact", contactHandler],
];

const server = createServer(async (req, res) => {
  try {
    const route = apiRoutes.find(([prefix]) => req.url === prefix || req.url?.startsWith(`${prefix}?`));

    if (route) {
      await route[1](req, res);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    console.error("Server error:", error);
    sendJson(res, 500, { error: "Server error." });
  }
});

server.listen(port, () => {
  console.log(`Portfolio server listening on port ${port}`);
});

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = unquoteEnvValue(trimmedLine.slice(separatorIndex + 1).trim());

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const pathname = decodeURIComponent(requestUrl.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(buildDir, requestedPath));

  if (!filePath.startsWith(buildDir)) {
    sendJson(res, 403, { error: "Forbidden." });
    return;
  }

  const staticFile = await getReadableFile(filePath);

  if (staticFile) {
    streamFile(staticFile, res);
    return;
  }

  const acceptsHtml = req.headers.accept?.includes("text/html");

  if (acceptsHtml || !path.extname(pathname)) {
    streamFile(path.join(buildDir, "index.html"), res);
    return;
  }

  sendJson(res, 404, { error: "Not found." });
}

async function getReadableFile(filePath) {
  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile() ? filePath : null;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function streamFile(filePath, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", getContentType(filePath));
  createReadStream(filePath).pipe(res);
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
    }[extension] || "application/octet-stream"
  );
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
