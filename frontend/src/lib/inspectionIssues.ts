import { supabase } from '@/lib/supabase'
import { normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

export type InspectionIssueSeverity = 'high' | 'medium' | 'low'
export type InspectionIssueStatus = 'open' | 'under-review' | 'in-repair' | 'fixed' | 'rejected'

export type InspectionIssueRecord = {
  id: string
  issueId: string
  inspectionId: string
  vehicleId: string | null
  vehicle: string
  vehicleStatus: string
  driver: string
  reportedBy: string
  inspectionType: 'pre-trip' | 'post-trip'
  inspectionDate: string
  title: string
  description: string
  checklistItem: string
  severity: InspectionIssueSeverity
  status: InspectionIssueStatus
  fraudFlag: boolean
  inspectionNotes: string
  createdAt: string
  photos: string[]
}

type FetchInspectionIssuesOptions = {
  driverAuthUserId?: string | null
  limit?: number
  locale?: string
}

function formatPersonName(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim()
  return fullName || fallback || '—'
}

function capitalizeRole(role?: string | null) {
  if (!role) {
    return 'User'
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatIssueDate(value?: string | null, locale = 'en-US') {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getIssuePhotos(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function deriveIssueSeverity(response: any, vehicleStatus: string): InspectionIssueSeverity {
  const photos = getIssuePhotos(response?.photos)

  if (vehicleStatus === 'blocked' || vehicleStatus === 'in-repair' || response?.required || response?.photo_required) {
    return 'high'
  }

  if (photos.length > 0 || normalizeText(response?.note)) {
    return 'medium'
  }

  return 'low'
}

function deriveIssueStatus(vehicleStatus: string): InspectionIssueStatus {
  if (vehicleStatus === 'in-repair') {
    return 'in-repair'
  }

  if (vehicleStatus === 'blocked') {
    return 'under-review'
  }

  return 'open'
}

export async function fetchInspectionIssues(companyId: string, options: FetchInspectionIssuesOptions = {}) {
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
      return [] as InspectionIssueRecord[]
    }
  }

  let query = supabase
    .from('inspections')
    .select('id, created_at, vehicle_id, driver_id, performed_by_user_id, inspection_type, responses, notes')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (driverIdFilter) {
    query = query.eq('driver_id', driverIdFilter)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data: inspections, error: inspectionsError } = await query

  if (inspectionsError) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(inspectionsError.message) || inspectionsError.message)
  }

  const inspectionRows = inspections || []

  if (inspectionRows.length === 0) {
    return [] as InspectionIssueRecord[]
  }

  const vehicleIds = [...new Set(inspectionRows.map((inspection) => inspection.vehicle_id).filter(Boolean))]
  const driverIds = [...new Set(inspectionRows.map((inspection) => inspection.driver_id).filter(Boolean))]
  const performerIds = [...new Set(inspectionRows.map((inspection) => inspection.performed_by_user_id).filter(Boolean))]

  const [{ data: vehicles, error: vehiclesError }, { data: drivers, error: driversError }, { data: profiles, error: profilesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    vehicleIds.length
      ? supabase.from('vehicles').select('id, unit, make, model, status').in('id', vehicleIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', driverIds)
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

  const vehicleMap = new Map((vehicles || []).map((vehicle: any) => {
    const name = `${vehicle.make || ''} ${vehicle.model || ''}`.trim()
    return [vehicle.id, {
      id: vehicle.id,
      label: name ? `${name} #${vehicle.unit}` : vehicle.unit || '—',
      status: vehicle.status || 'active',
    }]
  }))
  const driverMap = new Map((drivers || []).map((driver: any) => [driver.id, formatPersonName(driver.first_name, driver.last_name, '—')]))
  const profileMap = new Map((profiles || []).map((profile: any) => [profile.auth_user_id, formatPersonName(profile.first_name, profile.last_name, profile.email || '—')]))
  const membershipRoleMap = new Map((memberships || []).map((membership: any) => [membership.user_id, membership.role || null]))

  const locale = options.locale || 'en-US'
  const issueRecords: InspectionIssueRecord[] = []

  for (const inspection of inspectionRows) {
    const responses = Array.isArray(inspection.responses) ? inspection.responses : []
    const vehicle = inspection.vehicle_id ? vehicleMap.get(inspection.vehicle_id) : null
    const performerName = profileMap.get(inspection.performed_by_user_id)
    const performerRole = membershipRoleMap.get(inspection.performed_by_user_id)
    const performedBy = performerRole ? `${performerName || capitalizeRole(performerRole)} (${performerRole})` : performerName || '—'

    responses.forEach((response: any, index: number) => {
      if (response?.state !== 'fail') {
        return
      }

      const responseId = normalizeText(response?.id) || `${index + 1}`
      const issueTitle = normalizeText(response?.label) || normalizeText(response?.section) || 'Inspection issue'
      const issueDescription = normalizeText(response?.note)
      const issuePhotos = getIssuePhotos(response?.photos)
      const vehicleStatus = vehicle?.status || 'needs-attention'

      issueRecords.push({
        id: `${inspection.id}__${responseId}`,
        issueId: `ISS-${inspection.id.slice(0, 8).toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
        inspectionId: inspection.id,
        vehicleId: inspection.vehicle_id || null,
        vehicle: vehicle?.label || '—',
        vehicleStatus,
        driver: inspection.driver_id ? driverMap.get(inspection.driver_id) || '—' : '—',
        reportedBy: performedBy,
        inspectionType: inspection.inspection_type === 'post-trip' ? 'post-trip' : 'pre-trip',
        inspectionDate: formatIssueDate(inspection.created_at, locale),
        title: issueTitle,
        description: issueDescription,
        checklistItem: normalizeText(response?.section) || issueTitle,
        severity: deriveIssueSeverity(response, vehicleStatus),
        status: deriveIssueStatus(vehicleStatus),
        fraudFlag: false,
        inspectionNotes: normalizeText(inspection.notes),
        createdAt: formatIssueDate(inspection.created_at, locale),
        photos: issuePhotos,
      })
    })
  }

  return issueRecords
}

export async function fetchInspectionIssueById(companyId: string, issueId: string, options: FetchInspectionIssuesOptions = {}) {
  const issues = await fetchInspectionIssues(companyId, options)
  return issues.find((issue) => issue.id === issueId) || null
}