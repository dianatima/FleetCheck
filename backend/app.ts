import Fastify from 'fastify'

import indexRoute from './routes/index.route.js'
import viteMiddleware from './plugins/vite.js'
import distMiddleware from './plugins/dist.js'

export async function buildApp() {
    const app = Fastify({ logger: true })

    // routes
    app.register(indexRoute)

    // Vite middleware
    app.register(process.env.NODE_ENV !== 'production' ? viteMiddleware : distMiddleware)

    // Add custom API routes as usual
    app.get('/api/data', async (request, reply) => {
        return { hello: 'world' }
    })

    return app
}