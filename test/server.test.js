const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../src/server/server');

describe('term-ai-helper - Web Studio Server & API', () => {
  let server;
  const PORT = 3998;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/health returns 200 and ok status', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.app, 'term-ai-helper');
  });

  it('POST /api/synthesize returns synthesized command and risk', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'kill port 5000', shell: 'pwsh' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.command.includes('5000'), true);
    assert.ok(data.risk);
  });

  it('GET /api/templates returns prompt templates list', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/templates`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(Array.isArray(data.templates), true);
    assert.equal(data.templates.length > 0, true);
  });

  it('GET / serves Web Studio index.html', async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.equal(html.includes('Term-AI'), true);
  });

  it('Security: Path traversal attempts should return 403 Forbidden', async () => {
    const status = await new Promise((resolve) => {
      http.get({ hostname: '127.0.0.1', port: PORT, path: '/%2e%2e/%2e%2e/package.json' }, (res) => {
        resolve(res.statusCode);
      });
    });
    assert.equal(status, 403);
  });
});
