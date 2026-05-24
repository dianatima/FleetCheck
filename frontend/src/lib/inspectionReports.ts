import { supabase } from '@/lib/supabase'
import { normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

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

export type InspectionReportResponseRecord = {
  id: string
  section: string
  label: string
  state: 'pass' | 'fail' | null
  note: string
  photos: string[]
  required: boolean
  photoRequired: boolean
}

export type InspectionReportDetailRecord = InspectionReportRecord & {
  vehicleId: string | null
  inspectionType: 'pre-trip' | 'post-trip'
  notes: string
  responses: InspectionReportResponseRecord[]
}

type PersistedInspectionReviewStatus = Exclude<InspectionReportRecord['reviewStatus'], ''>

type InspectionReviewRecord = {
  inspection_id: string
  review_status: PersistedInspectionReviewStatus
  manager_note: string | null
}

export type SavedInspectionReviewRecord = {
  inspectionId: string
  reviewStatus: PersistedInspectionReviewStatus
  managerNote: string
}

type FetchInspectionReportsOptions = {
  driverAuthUserId?: string | null
  limit?: number
  locale?: string
}

type FetchInspectionReportByIdOptions = {
  driverAuthUserId?: string | null
  locale?: string
}

type InspectionRow = {
  id: string
  created_at: string | null
  vehicle_id: string | null
  driver_id: string | null
  performed_by_user_id: string | null
  inspection_type: string | null
  result: string | null
  responses: unknown
  notes?: string | null
}

type DriverLookupRecord = {
  name: string
  authUserId: string | null
}

type InspectionRelatedMaps = {
  vehicleMap: Map<string, string>
  driverMap: Map<string, DriverLookupRecord>
  profileMap: Map<string, string>
  membershipRoleMap: Map<string, string | null>
}

type InspectionReviewMap = Map<string, SavedInspectionReviewRecord>

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

function formatInspectionDate(value?: string | null, locale = 'en-US') {
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

function formatVehicleLabel(vehicle: any) {
  const modelLabel = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()

  if (modelLabel && vehicle?.unit) {
    return `${modelLabel} #${vehicle.unit}`
  }

  return modelLabel || vehicle?.unit || 'Unknown vehicle'
}

function normalizeResponseState(value: unknown): InspectionReportResponseRecord['state'] {
  if (value === 'pass' || value === 'fail') {
    return value
  }

  return null
}

function normalizeInspectionResponses(responses: unknown) {
  if (!Array.isArray(responses)) {
    return [] as InspectionReportResponseRecord[]
  }

  return responses.map((response: any, index) => ({
    id: typeof response?.id === 'string' && response.id.trim() ? response.id : `item-${index + 1}`,
    section: typeof response?.section === 'string' && response.section.trim() ? response.section.trim() : 'General',
    label: typeof response?.label === 'string' && response.label.trim() ? response.label.trim() : `Checklist item ${index + 1}`,
    state: normalizeResponseState(response?.state),
    note: typeof response?.note === 'string' ? response.note.trim() : '',
    photos: Array.isArray(response?.photos) ? response.photos.filter((photo: unknown): photo is string => typeof photo === 'string' && photo.trim().length > 0) : [],
    required: Boolean(response?.required),
    photoRequired: Boolean(response?.photo_required ?? response?.photoRequired),
  })) satisfies InspectionReportResponseRecord[]
}

function countIssues(responses: InspectionReportResponseRecord[]) {
  return responses.filter((response) => response.state === 'fail').length
}

function countPhotos(responses: InspectionReportResponseRecord[]) {
  return responses.reduce((total, response) => total + response.photos.length, 0)
}

function buildReviewStatus(responses: InspectionReportResponseRecord[]): InspectionReportRecord['reviewStatus'] {
  return countIssues(responses) > 0 ? 'needs-review' : ''
}

function isInspectionReviewsSchemaMissing(message?: string | null) {
  if (!message) {
    return false
  }

  const normalizedMessage = message.toLowerCase()

  return normalizedMessage.includes('inspection_reviews')
    && (normalizedMessage.includes('schema cache') || normalizedMessage.includes('does not exist') || normalizedMessage.includes('could not find the table'))
}

function normalizePersistedReviewStatus(value: unknown): PersistedInspectionReviewStatus | null {
  if (value === 'needs-review' || value === 'reviewed-ok' || value === 'reviewed-flag') {
    return value
  }

  return null
}

async function resolveDriverIdFilter(driverAuthUserId?: string | null) {
  if (!driverAuthUserId) {
    return null
  }

  const { data: driverRecord, error: driverError } = await supabase
    .from('drivers')
    .select('id')
    .eq('auth_user_id', driverAuthUserId)
    .maybeSingle()

  if (driverError) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(driverError.message) || driverError.message)
  }

  return driverRecord?.id || null
}

async function fetchInspectionRelatedMaps(companyId: string, inspectionRows: InspectionRow[]) {
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

  return {
    vehicleMap: new Map((vehicles || []).map((vehicle: any) => [vehicle.id, formatVehicleLabel(vehicle)])),
    driverMap: new Map((drivers || []).map((driver: any) => [driver.id, {
      name: formatPersonName(driver.first_name, driver.last_name, 'Unassigned driver'),
      authUserId: driver.auth_user_id || null,
    }])),
    profileMap: new Map((profiles || []).map((profile: any) => [profile.auth_user_id, formatPersonName(profile.first_name, profile.last_name, profile.email || 'User')])),
    membershipRoleMap: new Map((memberships || []).map((membership: any) => [membership.user_id, membership.role || null])),
  } satisfies InspectionRelatedMaps
}

function buildInspectionReportRecord(inspection: InspectionRow, relatedMaps: InspectionRelatedMaps, locale = 'en-US') {
  const responses = normalizeInspectionResponses(inspection.responses)
  const driverInfo = inspection.driver_id ? relatedMaps.driverMap.get(inspection.driver_id) : null
  const performerName = inspection.performed_by_user_id ? relatedMaps.profileMap.get(inspection.performed_by_user_id) : null
  const performerRole = inspection.performed_by_user_id ? relatedMaps.membershipRoleMap.get(inspection.performed_by_user_id) : null
  const performerLabel = performerName || `${capitalizeRole(performerRole)} account`

  return {
    id: inspection.id,
    date: formatInspectionDate(inspection.created_at, locale),
    vehicle: inspection.vehicle_id ? relatedMaps.vehicleMap.get(inspection.vehicle_id) || 'Unknown vehicle' : 'Unknown vehicle',
    driver: driverInfo?.name || 'No driver linked',
    performedBy: performerRole ? `${performerLabel} (${performerRole})` : performerLabel,
    type: inspection.inspection_type === 'post-trip' ? 'Post-Trip' : 'Pre-Trip',
    result: inspection.result === 'fail' ? 'fail' : 'pass',
    issues: countIssues(responses),
    photos: countPhotos(responses),
    signed: false,
    status: 'submitted',
    reviewStatus: buildReviewStatus(responses),
    managerNote: '',
  } satisfies InspectionReportRecord
}

function applyReviewRecord(report: InspectionReportRecord, review?: SavedInspectionReviewRecord) {
  if (!review) {
    return report
  }

  return {
    ...report,
    reviewStatus: review.reviewStatus,
    managerNote: review.managerNote,
  } satisfies InspectionReportRecord
}

async function fetchInspectionReviewMap(companyId: string, inspectionIds: string[]) {
  const uniqueInspectionIds = [...new Set(inspectionIds.filter(Boolean))]

  if (uniqueInspectionIds.length === 0) {
    return new Map() as InspectionReviewMap
  }

  const { data, error } = await supabase
    .from('inspection_reviews')
    .select('inspection_id, review_status, manager_note')
    .eq('company_id', companyId)
    .in('inspection_id', uniqueInspectionIds)

  if (error) {
    if (isInspectionReviewsSchemaMissing(error.message)) {
      return new Map() as InspectionReviewMap
    }

    throw new Error(normalizeSupabaseSchemaErrorMessage(error.message) || error.message)
  }

  return new Map((data || []).flatMap((review: InspectionReviewRecord) => {
    const reviewStatus = normalizePersistedReviewStatus(review.review_status)

    if (!reviewStatus) {
      return []
    }

    return [[review.inspection_id, {
      inspectionId: review.inspection_id,
      reviewStatus,
      managerNote: typeof review.manager_note === 'string' ? review.manager_note.trim() : '',
    } satisfies SavedInspectionReviewRecord]]
  }))
}

export async function fetchInspectionReports(companyId: string, options: FetchInspectionReportsOptions = {}) {
  const driverIdFilter = await resolveDriverIdFilter(options.driverAuthUserId)

  if (options.driverAuthUserId && !driverIdFilter) {
    return [] as InspectionReportRecord[]
  }

  let inspectionsQuery = supabase
    .from('inspections')
    .select('id, created_at, vehicle_id, driver_id, performed_by_user_id, inspection_type, result, responses')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (driverIdFilter) {
    inspectionsQuery = inspectionsQuery.eq('driver_id', driverIdFilter)
  }

  if (options.limit) {
    inspectionsQuery = inspectionsQuery.limit(options.limit)
  }

  const { data: inspections, error: inspectionsError } = await inspectionsQuery

  if (inspectionsError) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(inspectionsError.message) || inspectionsError.message)
  }

  const inspectionRows = inspections || []

  if (inspectionRows.length === 0) {
    return [] as InspectionReportRecord[]
  }

  const relatedMaps = await fetchInspectionRelatedMaps(companyId, inspectionRows)
  const reviewMap = await fetchInspectionReviewMap(companyId, inspectionRows.map((inspection) => inspection.id))

  return inspectionRows.map((inspection) => applyReviewRecord(buildInspectionReportRecord(inspection, relatedMaps, options.locale), reviewMap.get(inspection.id)))
}

export async function fetchInspectionReportById(companyId: string, reportId: string, options: FetchInspectionReportByIdOptions = {}) {
  const driverIdFilter = await resolveDriverIdFilter(options.driverAuthUserId)

  if (options.driverAuthUserId && !driverIdFilter) {
    return null as InspectionReportDetailRecord | null
  }

  let inspectionQuery = supabase
    .from('inspections')
    .select('id, created_at, vehicle_id, driver_id, performed_by_user_id, inspection_type, result, responses, notes')
    .eq('company_id', companyId)
    .eq('id', reportId)

  if (driverIdFilter) {
    inspectionQuery = inspectionQuery.eq('driver_id', driverIdFilter)
  }

  const { data: inspection, error: inspectionError } = await inspectionQuery.maybeSingle()

  if (inspectionError) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(inspectionError.message) || inspectionError.message)
  }

  if (!inspection) {
    return null as InspectionReportDetailRecord | null
  }

  const relatedMaps = await fetchInspectionRelatedMaps(companyId, [inspection])
  const summary = buildInspectionReportRecord(inspection, relatedMaps, options.locale)
  const reviewMap = await fetchInspectionReviewMap(companyId, [inspection.id])
  const review = reviewMap.get(inspection.id)

  return {
    ...applyReviewRecord(summary, review),
    vehicleId: inspection.vehicle_id || null,
    inspectionType: inspection.inspection_type === 'post-trip' ? 'post-trip' : 'pre-trip',
    notes: typeof inspection.notes === 'string' ? inspection.notes.trim() : '',
    responses: normalizeInspectionResponses(inspection.responses),
  } satisfies InspectionReportDetailRecord
}

export async function saveInspectionReportReview(input: {
  companyId: string
  inspectionId: string
  reviewedByUserId: string
  reviewStatus: PersistedInspectionReviewStatus
  managerNote?: string
}) {
  const payload = {
    company_id: input.companyId,
    inspection_id: input.inspectionId,
    reviewed_by_user_id: input.reviewedByUserId,
    review_status: input.reviewStatus,
    manager_note: input.managerNote?.trim() || '',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('inspection_reviews')
    .upsert(payload, { onConflict: 'inspection_id' })
    .select('inspection_id, review_status, manager_note')
    .maybeSingle()

  if (error) {
    throw new Error(normalizeSupabaseSchemaErrorMessage(error.message) || error.message)
  }

  const reviewStatus = normalizePersistedReviewStatus(data?.review_status)

  if (!data?.inspection_id || !reviewStatus) {
    throw new Error('Inspection review could not be saved.')
  }

  return {
    inspectionId: data.inspection_id,
    reviewStatus,
    managerNote: typeof data.manager_note === 'string' ? data.manager_note.trim() : '',
  } satisfies SavedInspectionReviewRecord
}