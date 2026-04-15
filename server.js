// ============================================================================
// ActionVault Dev Server
// Serves static files and proxies /api/chat to Ollama at localhost:11434
// so the browser-based chat widget can communicate with the local LLM.
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {

  // ---- Proxy: POST /api/chat → Ollama ----
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';

    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const ollamaReq = http.request({
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (ollamaRes) => {
        // Stream the response back to the browser
        res.writeHead(ollamaRes.statusCode, {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache'
        });
        ollamaRes.on('data', chunk => res.write(chunk));
        ollamaRes.on('end', () => res.end());
      });

      ollamaReq.on('error', (err) => {
        console.error('Ollama proxy error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cannot connect to Ollama. Is it running?' }));
      });

      ollamaReq.write(body);
      ollamaReq.end();
    });

    return;
  }

  // ---- Static file serving ----
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Prevent directory traversal
  filePath = path.join(__dirname, path.normalize(filePath));

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  ActionVault running at http://localhost:' + PORT);
  console.log('  Ollama proxy:  /api/chat → localhost:' + OLLAMA_PORT);
  console.log('='.repeat(50));
});
