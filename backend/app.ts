import 'dotenv/config'
import Fastify from 'fastify'

import indexRoute from './routes/index.route.js'
import driverInvitationsRoute from './routes/driver-invitations.route.js'
import viteMiddleware from './plugins/vite.js'
import distMiddleware from './plugins/dist.js'

export async function buildApp() {
    const app = Fastify({ logger: true })
    const isDev = process.env.NODE_ENV === 'development'

    // routes
    app.register(indexRoute)
    app.register(driverInvitationsRoute)

    // Vite middleware
    app.register(isDev ? viteMiddleware : distMiddleware)

    // Add custom API routes as usual
    app.get('/api/data', async (request, reply) => {
        return { hello: 'world' }
    })

    return app
}
