import { FastifyPluginAsync } from 'fastify'

const supportedTranslationLanguages = ['en', 'uk', 'es', 'fr'] as const

type TranslationLanguage = (typeof supportedTranslationLanguages)[number]
type TranslationRequestBody = {
    section?: string
    label?: string
    targetLanguages?: TranslationLanguage[]
}

const deeplLanguageMap: Record<TranslationLanguage, string> = {
    en: 'EN',
    uk: 'UK',
    es: 'ES',
    fr: 'FR',
}

function getTranslationProvider() {
    if (process.env.DEEPL_API_KEY) {
        return 'deepl'
    }

    if (process.env.LIBRETRANSLATE_URL) {
        return 'libretranslate'
    }

    return ''
}

function isSupportedTranslationLanguage(value: unknown): value is TranslationLanguage {
    return typeof value === 'string' && supportedTranslationLanguages.includes(value as TranslationLanguage)
}

function normalizeTranslationText(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
}

async function translateWithDeepL(text: string, targetLanguage: TranslationLanguage) {
    const response = await fetch(process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
            Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            text,
            target_lang: deeplLanguageMap[targetLanguage],
        }),
    })

    const payload = await response.json().catch(() => null) as { message?: string; translations?: Array<{ text?: string }> } | null

    if (!response.ok) {
        throw new Error(payload?.message || `DeepL translation request failed with status ${response.status}.`)
    }

    return payload?.translations?.[0]?.text?.trim() || text
}

async function translateWithLibreTranslate(text: string, targetLanguage: TranslationLanguage) {
    const response = await fetch(process.env.LIBRETRANSLATE_URL as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            q: text,
            source: 'auto',
            target: targetLanguage,
            format: 'text',
            api_key: process.env.LIBRETRANSLATE_API_KEY,
        }),
    })

    const payload = await response.json().catch(() => null) as { error?: string; translatedText?: string } | null

    if (!response.ok) {
        throw new Error(payload?.error || `LibreTranslate request failed with status ${response.status}.`)
    }

    return payload?.translatedText?.trim() || text
}

async function translateText(text: string, targetLanguage: TranslationLanguage) {
    if (!text.trim()) {
        return ''
    }

    if (process.env.DEEPL_API_KEY) {
        return translateWithDeepL(text, targetLanguage)
    }

    if (process.env.LIBRETRANSLATE_URL) {
        return translateWithLibreTranslate(text, targetLanguage)
    }

    throw new Error('Automatic translation is not configured on the server. Set DEEPL_API_KEY or LIBRETRANSLATE_URL.')
}

const indexRoute: FastifyPluginAsync = async (app) => {
    app.get('/api/test', async () => {
        return { hello: 'world' }
    })

    app.get('/api/template-translations/status', async () => {
        const provider = getTranslationProvider()

        return {
            configured: Boolean(provider),
            provider: provider || null,
        }
    })

    app.post('/api/template-translations', async (request, reply) => {
        const provider = getTranslationProvider()

        if (!provider) {
            return reply.status(503).send({
                error: 'Automatic translation is not configured on the server. Set DEEPL_API_KEY or LIBRETRANSLATE_URL.',
            })
        }

        const body = (request.body || {}) as TranslationRequestBody
        const section = normalizeTranslationText(body.section)
        const label = normalizeTranslationText(body.label)
        const targetLanguages = (Array.isArray(body.targetLanguages) ? body.targetLanguages : [...supportedTranslationLanguages])
            .filter(isSupportedTranslationLanguage)

        if (!section && !label) {
            return reply.status(400).send({ error: 'Section or checklist item text is required.' })
        }

        if (!targetLanguages.length) {
            return reply.status(400).send({ error: 'At least one target language is required.' })
        }

        try {
            const translations = Object.fromEntries(
                await Promise.all(targetLanguages.map(async (language) => {
                    const translatedSection = section ? await translateText(section, language) : ''
                    const translatedLabel = label ? await translateText(label, language) : ''

                    return [language, {
                        section: translatedSection,
                        label: translatedLabel,
                    }] as const
                })),
            )

            return {
                provider,
                translations,
            }
        } catch (error) {
            request.log.error(error)

            return reply.status(502).send({
                error: error instanceof Error ? error.message : 'Unable to translate template item text.',
            })
        }
    })

    app.get('/health', async () => {
        return { status: 'ok' }
    })
}

export default indexRoute