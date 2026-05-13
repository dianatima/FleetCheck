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
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.svg': 'image/svg+xml',
        }[ext] || 'text/plain';

        return reply.type(contentType).send(content);
    });
}

export default viteMiddleware