import type { Language } from '@/stores/app'

export function dateLocale(language?: Language | string) {
  return {
    en: 'en-US',
    uk: 'uk-UA',
    ru: 'ru-RU',
    es: 'es-ES',
    fr: 'fr-FR',
  }[language || 'en'] || 'en-US'
}

export function formatDateTime(value: string | null | undefined, language?: Language | string, fallback = '—') {
  if (!value) return fallback

  return new Intl.DateTimeFormat(dateLocale(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  }).format(new Date(value))
}

export function formatDateOnly(value: string | null | undefined, language?: Language | string, fallback = '—') {
  if (!value) return fallback

  return new Intl.DateTimeFormat(dateLocale(language), {
    dateStyle: 'medium',
  }).format(new Date(value))
}
