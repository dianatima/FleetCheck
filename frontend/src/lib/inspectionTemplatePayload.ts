import type { Language } from '@/stores/app'

export type TemplateNameTranslations = Partial<Record<Language, string>>

type InspectionTemplateMeta = {
  nameTranslations?: TemplateNameTranslations | null
}

type InspectionTemplateObjectPayload<T> = {
  checklist?: T[] | null
  items?: T[] | null
  meta?: InspectionTemplateMeta | null
}

const supportedTemplateLanguages: Language[] = ['en', 'uk', 'es', 'fr']

export function sanitizeTemplateNameTranslations(translations?: TemplateNameTranslations | null) {
  if (!translations) {
    return undefined
  }

  const entries = supportedTemplateLanguages
    .map((language) => {
      const value = translations[language]?.trim()

      if (!value) {
        return null
      }

      return [language, value] as const
    })
    .filter(Boolean) as Array<readonly [Language, string]>

  return entries.length ? Object.fromEntries(entries) as TemplateNameTranslations : undefined
}

export function parseInspectionTemplatePayload<T>(value: unknown) {
  if (Array.isArray(value)) {
    return {
      items: value as T[],
      nameTranslations: undefined,
    }
  }

  if (!value || typeof value !== 'object') {
    return {
      items: [] as T[],
      nameTranslations: undefined,
    }
  }

  const payload = value as InspectionTemplateObjectPayload<T>
  const checklist = Array.isArray(payload.checklist)
    ? payload.checklist
    : Array.isArray(payload.items)
      ? payload.items
      : []

  return {
    items: checklist as T[],
    nameTranslations: sanitizeTemplateNameTranslations(payload.meta?.nameTranslations),
  }
}

export function buildInspectionTemplatePayload<T>(items: T[], meta?: InspectionTemplateMeta | null) {
  const nameTranslations = sanitizeTemplateNameTranslations(meta?.nameTranslations)

  if (!nameTranslations) {
    return items
  }

  return {
    checklist: items,
    meta: {
      nameTranslations,
    },
  }
}

export function getLocalizedTemplateName(name: string | null | undefined, nameTranslations: TemplateNameTranslations | null | undefined, language: Language) {
  return nameTranslations?.[language]?.trim() || (name || '').trim()
}