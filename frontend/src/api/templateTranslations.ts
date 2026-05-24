import type { TemplateItemTranslations } from '@/lib/inspectionTemplateCatalog'
import type { Language } from '@/stores/app'

const defaultTargetLanguages: Language[] = ['en', 'uk', 'es', 'fr']
export type TextTranslations = Partial<Record<Language, string>>

type TranslationResponse = {
  provider?: string
  translations?: TemplateItemTranslations
  error?: string
}

type TranslationStatusResponse = {
  configured?: boolean
  provider?: string | null
}

export async function requestTemplateItemTranslations(input: {
  section: string
  label: string
  targetLanguages?: Language[]
}) {
  const response = await fetch('/api/template-translations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section: input.section,
      label: input.label,
      targetLanguages: input.targetLanguages || defaultTargetLanguages,
    }),
  })

  const payload = await response.json().catch(() => null) as TranslationResponse | null

  if (!response.ok || !payload?.translations) {
    throw new Error(payload?.error || 'Automatic translation is not available right now.')
  }

  return {
    provider: payload.provider || 'translation service',
    translations: payload.translations,
  }
}

export async function requestTextTranslations(input: {
  text: string
  targetLanguages?: Language[]
}) {
  const { provider, translations } = await requestTemplateItemTranslations({
    section: '',
    label: input.text,
    targetLanguages: input.targetLanguages,
  })

  return {
    provider,
    translations: Object.fromEntries(
      Object.entries(translations).flatMap(([language, entry]) => {
        const value = entry?.label?.trim()

        return value ? [[language, value]] : []
      }),
    ) as TextTranslations,
  }
}

export async function fetchTemplateTranslationStatus() {
  const response = await fetch('/api/template-translations/status')

  if (!response.ok) {
    throw new Error('Unable to load translation provider status.')
  }

  const payload = await response.json().catch(() => null) as TranslationStatusResponse | null

  return {
    configured: Boolean(payload?.configured),
    provider: payload?.provider || '',
  }
}