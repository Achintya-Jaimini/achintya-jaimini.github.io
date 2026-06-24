const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const port = Number(process.env.PORT || 5000);
const host = process.env.HOST || '127.0.0.1';
const submissionsPath = path.join(__dirname, 'contact-submissions.json');
const buildPath = path.join(__dirname, 'build');
const maxBodyBytes = 1024 * 1024;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body) > maxBodyBytes) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function cleanText(value) {
  return String(value || '').trim();
}

function validateSubmission(payload) {
  const submission = {
    name: cleanText(payload.name),
    email: cleanText(payload.email),
    subject: cleanText(payload.subject),
    message: cleanText(payload.message),
    submittedAt: new Date().toISOString()
  };

  if (!submission.name || !submission.email || !submission.subject || !submission.message) {
    return { error: 'All fields are required.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return { error: 'A valid email address is required.' };
  }

  return { submission };
}

async function readSubmissionsFile() {
  try {
    const fileContents = await fs.readFile(submissionsPath, 'utf8');
    const parsed = JSON.parse(fileContents);
    return Array.isArray(parsed.submissions) ? parsed : { submissions: [] };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { submissions: [] };
    }

    throw error;
  }
}

async function saveSubmission(submission) {
  const currentFile = await readSubmissionsFile();
  const nextFile = {
    submissions: [...currentFile.submissions, submission]
  };

  await fs.writeFile(submissionsPath, `${JSON.stringify(nextFile, null, 2)}\n`, 'utf8');
}

async function handleContactRequest(request, response) {
  if (request.method !== 'POST') {
    response.writeHead(405, { Allow: 'POST' });
    response.end();
    return;
  }

  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body);
    const { submission, error } = validateSubmission(payload);

    if (error) {
      sendJson(response, 400, { ok: false, error });
      return;
    }

    await saveSubmission(submission);
    sendJson(response, 201, { ok: true });
  } catch {
    sendJson(response, 500, { ok: false, error: 'Could not save contact submission.' });
  }
}

async function serveStaticFile(request, response) {
  const requestedUrl = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = requestedUrl.pathname === '/' ? '/index.html' : requestedUrl.pathname;
  const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(buildPath, safePath);

  if (!filePath.startsWith(buildPath)) {
    response.writeHead(403);
    response.end();
    return;
  }

  try {
    const fileContents = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
    });
    response.end(fileContents);
  } catch {
    filePath = path.join(buildPath, 'index.html');

    try {
      const fileContents = await fs.readFile(filePath);
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      response.end(fileContents);
    } catch {
      response.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      response.end('Build not found. Run npm run build before starting the server.');
    }
  }
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/contact')) {
    handleContactRequest(request, response);
    return;
  }

  serveStaticFile(request, response);
});

server.listen(port, host, () => {
  console.log(`Portfolio server running at http://${host}:${port}`);
});
