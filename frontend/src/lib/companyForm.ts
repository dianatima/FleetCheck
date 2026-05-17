import { AsYouType, getCountries, getCountryCallingCode } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import type { Language } from '@/stores/app'

export type CountryOption = {
  code: string
  name: string
  dialCode: string
  phonePlaceholder: string
}

const countryDisplayNames = typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null

export const countryOptions: CountryOption[] = getCountries()
  .map((code) => {
    const countryCode = code as CountryCode
    const name = countryDisplayNames?.of(countryCode) || countryCode
    const dialCode = `+${getCountryCallingCode(countryCode)}`

    return {
      code: countryCode,
      name,
      dialCode,
      phonePlaceholder: `${dialCode} ...`,
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

const languageFallbackCountry: Record<Language, string> = {
  en: 'US',
  uk: 'UA',
  es: 'ES',
  fr: 'FR',
}

function normalizeCountryCode(country: string | null | undefined) {
  if (!country) {
    return null
  }

  const trimmed = country.trim()
  const exactCode = countryOptions.find((option) => option.code === trimmed.toUpperCase())

  if (exactCode) {
    return exactCode.code
  }

  const exactName = countryOptions.find((option) => option.name.toLowerCase() === trimmed.toLowerCase())
  return exactName?.code || null
}

export function getCountryOption(country: string | null | undefined) {
  const code = normalizeCountryCode(country)
  return countryOptions.find((option) => option.code === code) || countryOptions[0]
}

export function getPreferredCountryCode(language: Language, locale?: string) {
  const regionCandidate = locale?.split('-')[1]?.toUpperCase()

  if (regionCandidate && countryOptions.some((option) => option.code === regionCandidate)) {
    return regionCandidate
  }

  return languageFallbackCountry[language] || 'US'
}

export function getPrioritizedCountries(language: Language, locale?: string) {
  const preferredCode = getPreferredCountryCode(language, locale)
  const sorted = [...countryOptions].sort((left, right) => left.name.localeCompare(right.name))
  const preferred = sorted.find((option) => option.code === preferredCode)

  if (!preferred) {
    return sorted
  }

  return [preferred, ...sorted.filter((option) => option.code !== preferredCode)]
}

export function formatPhoneByCountry(value: string, country: string | null | undefined) {
  const option = getCountryOption(country)

  if (!value.trim()) {
    return ''
  }

  return new AsYouType(option.code as CountryCode).input(value)
}

export function getCountryCode(country: string | null | undefined) {
  return getCountryOption(country).code.toLowerCase()
}
