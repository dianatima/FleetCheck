import { FastifyPluginAsync } from 'fastify'

const indexRoute: FastifyPluginAsync = async (app) => {
    app.get('/api/test', async () => {
        return { hello: 'world' }
    })

    app.get('/health', async () => {
        return { status: 'ok' }
    })
}

export default indexRoute