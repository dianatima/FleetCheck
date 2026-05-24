export function normalizeSupabaseSchemaErrorMessage(message?: string | null) {
  if (!message) {
    return null
  }

  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('public.inspection_templates')
    && (normalizedMessage.includes('schema cache') || normalizedMessage.includes('does not exist'))
  ) {
    return 'Inspection templates are not enabled in Supabase yet. Run docs/multi-company-schema.sql, then reload the app.'
  }

  if (
    normalizedMessage.includes('vehicle_company_assignments')
    && (normalizedMessage.includes('schema cache') || normalizedMessage.includes('does not exist'))
  ) {
    return 'Shared fleet assignments are not enabled in Supabase yet. Run docs/multi-company-schema.sql, then reload the app.'
  }

  if (
    normalizedMessage.includes('inspections')
    && normalizedMessage.includes('responses')
    && (normalizedMessage.includes('column') || normalizedMessage.includes('schema cache'))
  ) {
    return 'The inspection schema is outdated in Supabase. Run docs/multi-company-schema.sql, then reload the app.'
  }

  if (
    normalizedMessage.includes('inspections')
    && normalizedMessage.includes('signature_url')
    && (normalizedMessage.includes('column') || normalizedMessage.includes('schema cache'))
  ) {
    return 'The inspection signature column is not enabled in Supabase yet. Run docs/multi-company-schema.sql, then reload the app.'
  }

  return message
}

export function getSupabaseErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return normalizeSupabaseSchemaErrorMessage(error.message) || error.message
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return normalizeSupabaseSchemaErrorMessage(error.message) || error.message
  }

  return fallbackMessage
}

export function isSupabaseMissingColumnError(error: unknown, table: string, column: string) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
  const message = 'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : ''

  if (!message) {
    return false
  }

  const normalizedTable = table.toLowerCase()
  const normalizedColumn = column.toLowerCase()
  const matchesQuotedPostgrestMessage = message.includes(`'${normalizedColumn}'`) && message.includes(`'${normalizedTable}'`)
  const matchesPostgresColumnMessage = message.includes(`column ${normalizedTable}.${normalizedColumn} does not exist`)

  if (code === 'PGRST204') {
    return matchesQuotedPostgrestMessage
  }

  if (code === '42703') {
    return matchesPostgresColumnMessage || message.includes(normalizedColumn)
  }

  return false
}