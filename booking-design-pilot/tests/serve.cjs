const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
http.createServer((req, res) => {
 const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
 if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
 fs.readFile(file, (err, data) => {
  if (err) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({ '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.md':'text/plain' })[path.extname(file)] || 'application/octet-stream'); res.end(data);
 });
}).listen(4173, '127.0.0.1');
