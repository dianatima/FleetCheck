import { createServer } from 'vite';
import { FastifyPluginAsync } from 'fastify'

const viteMiddleware: FastifyPluginAsync = async (app) => {

    const vite = await createServer({
        server: { middlewareMode: true },
        root: 'frontend',
        appType: 'spa'
    });


    app.setNotFoundHandler(async (request: any, reply: any) => {
        vite.middlewares(request.raw, reply.raw, (err: any) => {
            if (err) {
                app.log.error(err);
                reply.status(500).send(err.message);
            }
        });
        await reply;
    });
}

export default viteMiddleware