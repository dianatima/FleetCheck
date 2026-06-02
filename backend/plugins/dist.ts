import { FastifyPluginAsync } from 'fastify'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'

const DIST_PATH = path.join(process.cwd(), 'frontend', 'dist')

const contentTypes: Record<string, string> = {
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
}

const distMiddleware: FastifyPluginAsync = async (app) => {
  app.get('/*', async (request, reply) => {
    try {
      const rawUrl = request.raw.url || '/'
      const parsedUrl = new URL(rawUrl, 'http://localhost')
      let pathname = decodeURIComponent(parsedUrl.pathname)

      if (pathname === '/') {
        pathname = '/index.html'
      }

      const safePath = path
        .normalize(pathname)
        .replace(/^(\.\.[/\\])+/, '')
        .replace(/^[/\\]+/, '')

      let filePath = path.join(DIST_PATH, safePath)

      const fileExists = existsSync(filePath)

      if (!fileExists) {
        const isAssetRequest =
          pathname.startsWith('/assets/') ||
          pathname === '/manifest.json' ||
          pathname === '/vite.svg' ||
          pathname === '/favicon.ico'

        if (isAssetRequest) {
          return reply.code(404).send({ error: 'File not found' })
        }

        filePath = path.join(DIST_PATH, 'index.html')
      }

      const content = await fs.readFile(filePath)
      const ext = path.extname(filePath)
      const contentType = contentTypes[ext] || 'application/octet-stream'

      if (filePath.endsWith('index.html')) {
        reply.header('Cache-Control', 'no-store')
      }

      return reply.type(contentType).send(content)
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send({ error: 'Failed to serve frontend file' })
    }
  })
}

export default distMiddleware