import { supabase } from '@/lib/supabase'
import { isSupabaseMissingColumnError, normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

export type InspectionReportRecord = {
  id: string
  date: string
  vehicle: string
  driver: string
  performedBy: string
  type: string
  result: 'pass' | 'fail'
  issues: number
  photos: number
  signed: boolean
  status: 'submitted'
  reviewStatus: '' | 'needs-review' | 'reviewed-ok' | 'reviewed-flag'
  managerNote: string
}

type FetchInspectionReportsOptions = {
  driverAuthUserId?: string | null
  limit?: number
}

function formatPersonName(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()
  return fullName || fallback || 'Unknown'
}

function capitalizeRole(role?: string | null) {
  if (!role) {
    return 'User'
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatInspectionDate(value?: string | null) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function countIssues(responses: unknown) {
  if (!Array.isArray(responses)) {
    return 0
  }

  return responses.filter((response: any) => response?.state === 'fail').length
}

function countPhotos(responses: unknown) {
  if (!Array.isArray(responses)) {
    return 0
  }

  return responses.reduce((total: number, response: any) => total + (Array.isArray(response?.photos) ? response.photos.length : 0), 0)
}

export async function fetchInspectionReports(companyId: string, options: FetchInspectionReportsOptions = {}) {
  let driverIdFilter: string | null = null

  if (options.driverAuthUserId) {
    const { data: driverRecord, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('auth_user_id', options.driverAuthUserId)
      .maybeSingle()

    if (driverError) {
      throw new Error(normalizeSupabaseSchemaErrorMessage(driverError.message) || driverError.message)
    }

    driverIdFilter = driverRecord?.id || null

    if (!driverIdFilter) {
      return [] as InspectionReportRecord[]
    }
  }

  const buildInspectionsQuery = (includeSignatureUrl: boolean) => {
    let query = supabase
      .from('inspections')
      .select(includeSignatureUrl
        ? 'id, created_at, vehicle_id, driver_id, performed_by_user_id, inspection_type, result, responses, signature_url'
        : 'id, created_at, vehicle_id, driver_id, performed_by_user_id, inspection_type, result, responses')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (driverIdFilter) {
      query = query.eq('driver_id', driverIdFilter)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    return query
  }

  let { data: inspections, error: inspectionsError } = await buildInspectionsQuery(true)

  if (isSupabaseMissingColumnError(inspectionsError, 'inspections', 'signature_url')) {
    const fallbackQuery = await buildInspectionsQuery(false)
    inspections = fallbackQuery.data
    inspectionsError = fallbackQuery.error
  }

  if (inspectionsError) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(inspectionsError.message) || inspectionsError.message)
  }

  const inspectionRows = inspections || []

  if (inspectionRows.length === 0) {
    return [] as InspectionReportRecord[]
  }

  const vehicleIds = [...new Set(inspectionRows.map((inspection) => inspection.vehicle_id).filter(Boolean))]
  const driverIds = [...new Set(inspectionRows.map((inspection) => inspection.driver_id).filter(Boolean))]
  const performerIds = [...new Set(inspectionRows.map((inspection) => inspection.performed_by_user_id).filter(Boolean))]

  const [{ data: vehicles, error: vehiclesError }, { data: drivers, error: driversError }, { data: profiles, error: profilesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    vehicleIds.length
      ? supabase.from('vehicles').select('id, unit, make, model').in('id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length
      ? supabase.from('drivers').select('id, auth_user_id, first_name, last_name').in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    performerIds.length
      ? supabase.from('profiles').select('auth_user_id, first_name, last_name, email').in('auth_user_id', performerIds)
      : Promise.resolve({ data: [], error: null }),
    performerIds.length
      ? supabase.from('company_memberships').select('user_id, role').eq('company_id', companyId).in('user_id', performerIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  for (const error of [vehiclesError, driversError, profilesError, membershipsError]) {
    if (error) {
      throw new Error(normalizeSupabaseSchemaErrorMessage(error.message) || error.message)
    }
  }

  const vehicleMap = new Map((vehicles || []).map((vehicle: any) => [vehicle.id, `${vehicle.make || ''} ${vehicle.model || ''}`.trim() ? `${`${vehicle.make || ''} ${vehicle.model || ''}`.trim()} #${vehicle.unit}` : vehicle.unit]))
  const driverMap = new Map((drivers || []).map((driver: any) => [driver.id, {
    name: formatPersonName(driver.first_name, driver.last_name, 'Unassigned driver'),
    authUserId: driver.auth_user_id || null,
  }]))
  const profileMap = new Map((profiles || []).map((profile: any) => [profile.auth_user_id, formatPersonName(profile.first_name, profile.last_name, profile.email || 'User')]))
  const membershipRoleMap = new Map((memberships || []).map((membership: any) => [membership.user_id, membership.role || null]))

  return inspectionRows.map((inspection: any) => {
    const driverInfo = inspection.driver_id ? driverMap.get(inspection.driver_id) : null
    const performerName = profileMap.get(inspection.performed_by_user_id)
    const performerRole = membershipRoleMap.get(inspection.performed_by_user_id)
    const performerLabel = performerName || `${capitalizeRole(performerRole)} account`

    return {
      id: inspection.id,
      date: formatInspectionDate(inspection.created_at),
      vehicle: vehicleMap.get(inspection.vehicle_id) || 'Unknown vehicle',
      driver: driverInfo?.name || 'No driver linked',
      performedBy: performerRole ? `${performerLabel} (${performerRole})` : performerLabel,
      type: inspection.inspection_type === 'post-trip' ? 'Post-Trip' : 'Pre-Trip',
      result: inspection.result === 'fail' ? 'fail' : 'pass',
      issues: countIssues(inspection.responses),
      photos: countPhotos(inspection.responses),
      signed: Boolean(inspection.signature_url),
      status: 'submitted',
      reviewStatus: countIssues(inspection.responses) > 0 ? 'needs-review' : '',
      managerNote: '',
    } satisfies InspectionReportRecord
  })
}