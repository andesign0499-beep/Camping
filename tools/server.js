const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HOST = '0.0.0.0';
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '/') reqUrl = '/index.html';

    const safePath = path.normalize(path.join(ROOT, reqUrl));
    if (!safePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('403 Forbidden');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
        });

        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at:`);
    console.log(` - Local:   http://localhost:${PORT}/`);
    console.log(` - Network: http://192.168.1.5:${PORT}/`);
});
