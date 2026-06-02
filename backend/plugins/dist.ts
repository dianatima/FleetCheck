import { FastifyPluginAsync } from 'fastify'
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
const DIST_PATH = path.join(process.cwd(), 'frontend/dist');

console.log('VITE_DIST_PATH:', DIST_PATH)
const viteMiddleware: FastifyPluginAsync = async (app) => {
    app.get('/*', async (request, reply) => {

        const fileCheck = path.join(DIST_PATH, request.url);
        const url = request.url === '/' || !existsSync(fileCheck) ? '/index.html' : request.url;
        const filePath = path.join(DIST_PATH, url);

        const content = await fs.readFile(filePath);

        // Manual Content-Type mapping
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'text/javascript; charset=utf-8',
            '.mjs': 'text/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.txt': 'text/plain; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.map': 'application/json; charset=utf-8',
        }[ext] || 'application/octet-stream';

        return reply.type(contentType).send(content);
    });
}

export default viteMiddleware