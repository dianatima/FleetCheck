import { buildApp } from './app.js'

const app = await buildApp()
const port = Number(process.env.PORT ?? 3000)

app.listen({ port, host: '0.0.0.0' })
    .then(() => {
        console.log(`Server running on http://localhost:${port}`)
    })
    .catch((err: unknown) => {
        app.log.error(err)
        process.exit(1)
    })
