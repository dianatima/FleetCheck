const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')

const KNOWN_PUBLIC_BUCKETS = [
  'inspection-photos',
  'vehicle-photos',
  'driver-files',
  'avatars',
  'inspection-reference-photos',
]

function isAbsolute(value: string) {
  return /^https?:\/\//i.test(value)
}

function isDataOrBlob(value: string) {
  return value.startsWith('data:') || value.startsWith('blob:')
}

export function resolvePhotoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null
  if (isDataOrBlob(trimmed) || isAbsolute(trimmed)) return trimmed

  if (!SUPABASE_URL) return trimmed

  const normalized = trimmed.replace(/^\/+/, '')

  if (normalized.startsWith('storage/v1/object/public/')) {
    return `${SUPABASE_URL}/${normalized}`
  }

  if (normalized.includes('/storage/v1/object/public/')) {
    const index = normalized.indexOf('storage/v1/object/public/')
    return `${SUPABASE_URL}/${normalized.slice(index)}`
  }

  const [bucket] = normalized.split('/')
  if (KNOWN_PUBLIC_BUCKETS.includes(bucket)) {
    return `${SUPABASE_URL}/storage/v1/object/public/${normalized}`
  }

  return trimmed
}

export function normalizePhotoUrls(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  const unique = new Set<string>()
  for (const value of values) {
    const resolved = resolvePhotoUrl(value)
    if (resolved) unique.add(resolved)
  }

  return [...unique]
}

export function firstUsablePhotoUrl(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const normalized = normalizePhotoUrls(candidate)
      if (normalized.length) return normalized[0]
      continue
    }

    const normalized = resolvePhotoUrl(candidate)
    if (normalized) return normalized
  }

  return null
}
