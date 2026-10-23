/**
 * term-ai-helper - Web Studio Server
 * Pure Node.js HTTP Server on Port 3028
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const { synthesizeCommand, PATTERNS } = require('../core/index');
const ansi = require('../cli/ansi');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function isPathSafe(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload Too Large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function createServer() {
  const uiDir = path.resolve(__dirname, '../ui');

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    // 0. API: /api/health (GET)
    if (pathname === '/api/health' && method === 'GET') {
      sendJson(res, 200, { status: 'ok', app: 'term-ai-helper', port: 3028 });
      return;
    }

    // 1. API: /api/synthesize (POST)
    if (pathname === '/api/synthesize' && method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const query = body.query || '';
        const shell = body.shell || 'pwsh';
        const result = synthesizeCommand(query, { shell });
        sendJson(res, 200, result);
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
      return;
    }

    // 2. API: /api/templates (GET)
    if (pathname === '/api/templates' && method === 'GET') {
      const templates = [
        { label: 'Kill process on port 3000', query: 'kill process on port 3000', category: 'Port' },
        { label: 'Undo last commit keeping changes', query: 'undo last commit keeping files', category: 'Git' },
        { label: 'Find files larger than 100MB', query: 'find files larger than 100mb', category: 'Disk' },
        { label: 'Docker remove stopped containers', query: 'delete all stopped containers', category: 'Docker' },
        { label: 'Grep text inside files', query: 'grep text "TODO" inside files', category: 'Search' },
        { label: 'Check external WAN IP', query: 'what is my public ip', category: 'Network' },
        { label: 'Check SSL certificate expiry', query: 'check ssl cert expiry for github.com', category: 'Security' }
      ];
      sendJson(res, 200, { templates });
      return;
    }

    // 3. Static Asset Serving with Path-Traversal Security
    let safePath = (pathname === '/' || req.url === '/') ? 'index.html' : req.url.split('?')[0];
    try {
      safePath = decodeURIComponent(safePath);
    } catch {
      // keep raw
    }

    const relativePath = safePath.replace(/^[/\\]+/, '');
    const filePath = path.resolve(uiDir, relativePath);

    if (!isPathSafe(uiDir, filePath) || safePath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden - Access Denied');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  return server;
}

function startServer(opts = {}) {
  const port = typeof opts === 'number' ? opts : (opts.port || 3028);
  const server = createServer();
  server.listen(port, () => {
    console.log(`\n${ansi.bold(ansi.cyan('╔════════════════════════════════════════════════════════════╗'))}`);
    console.log(`${ansi.bold(ansi.cyan('║'))}  ${ansi.bold(ansi.green('Term-AI Studio'))} is running!                               ${ansi.bold(ansi.cyan('║'))}`);
    console.log(`${ansi.bold(ansi.cyan('║'))}  ${ansi.yellow(`http://localhost:${port}`)}                                      ${ansi.bold(ansi.cyan('║'))}`);
    console.log(`${ansi.bold(ansi.cyan('╚════════════════════════════════════════════════════════════╝'))}\n`);
    console.log(ansi.gray('Press Ctrl+C to terminate the server.\n'));
  });
  return server;
}

module.exports = {
  createServer,
  startServer,
  isPathSafe
};
