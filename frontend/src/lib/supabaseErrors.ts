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

  return message
}