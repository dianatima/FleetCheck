import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { saveSignatureFallback } from '@/lib/signatureFallback'

type InspectionType = 'pre-trip' | 'post-trip'
type AvailabilityFilter = 'all' | 'available' | 'assigned' | 'unavailable' | 'repair'
const unresolvedIssueStatuses = ['under-review', 'in-repair']
const DEV_DRIVER_PREVIEW_KEY = 'fleetcheck.dev.driverPreview'

function isDevDriverPreviewEnabled() {
  if (!import.meta.env.DEV) return false
  return localStorage.getItem(DEV_DRIVER_PREVIEW_KEY) === '1'
}

function isMissingSignatureColumnsError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return (
    value.includes('signature_data_url') ||
    value.includes('signed_at') ||
    value.includes('signed_by_driver_id')
  )
}

function isMissingOnConflictConstraintError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return value.includes('on conflict') && value.includes('no unique')
}

const visibleVehicleSelect = `
  id,
  company_id,
  unit,
  make,
  model,
  year,
  plate,
  vin,
  odometer,
  odometer_unit,
  engine_hours,
  status,
  photo_url,
  vehicle_type_id,
  vehicle_types (
    id,
    name
  )
`

const visibleVehicleSelectLegacy = `
  id,
  company_id,
  unit,
  make,
  model,
  year,
  plate,
  vin,
  odometer,
  engine_hours,
  status,
  photo_url,
  vehicle_type_id,
  vehicle_types (
    id,
    name
  )
`

function isMissingOdometerUnitColumnError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return value.includes('odometer_unit')
}

function withDefaultOdometerUnit<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((row: any) => ({
      ...row,
      odometer_unit: row?.odometer_unit || 'mi',
    })) as T
  }

  if (data && typeof data === 'object') {
    const row = data as any
    return {
      ...row,
      odometer_unit: row?.odometer_unit || 'mi',
    } as T
  }

  return data
}

async function runVehicleQuery<T>(
  build: (selectClause: string) => Promise<{ data: T; error: any }>
) {
  let { data, error } = await build(visibleVehicleSelect)

  if (error && isMissingOdometerUnitColumnError(error.message)) {
    const retry = await build(visibleVehicleSelectLegacy)
    data = retry.data
    error = retry.error
  }

  return {
    data: withDefaultOdometerUnit(data),
    error,
  }
}

export const useDriverVehicleStore = defineStore('driverVehicles', () => {
  const authStore = useAuthStore()
  const vehicles = ref<any[]>([])
  const annotatedVehicles = ref<any[]>([])
  const filteredVehicles = ref<any[]>([])
  const selectedVehicle = ref<any | null>(null)
  const currentDriver = ref<any | null>(null)
  const activeAssignment = ref<any | null>(null)
  const currentDriverProfileId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const search = ref('')
  const availabilityFilter = ref<AvailabilityFilter>('all')

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const availableVehicles = computed(() => annotatedVehicles.value.filter(isDriverVehicleAvailable))
  const inspectableVehicles = computed(() =>
    annotatedVehicles.value.filter(isDriverVehicleInspectable)
  )

  async function fetchDriverContext() {
    if (isDevDriverPreviewEnabled()) {
      const previewDriver = await fetchPreviewDriverContext()
      if (previewDriver) return previewDriver
      return null
    }

    const profileId = authStore.profile?.id

    if (!profileId) {
      error.value = 'Driver profile is not loaded yet.'
      currentDriver.value = null
      currentDriverProfileId.value = null
      return null
    }

    if (currentDriver.value?.id && currentDriverProfileId.value === profileId) {
      return currentDriver.value
    }

    currentDriver.value = null
    currentDriverProfileId.value = profileId

    const { data, error: driverError } = await supabase
      .from('drivers')
      .select('id, company_id, license_class, status, user_id')
      .eq('user_id', profileId)
      .eq('status', 'active')
      .maybeSingle()

    if (driverError || !data) {
      error.value =
        driverError?.message ||
        `Active driver row was not found for profile.id ${profileId}. Expected drivers.user_id to match this profile.`
      currentDriver.value = null
      return null
    }

    currentDriver.value = data
    return data
  }

  async function fetchActiveDriverForInspection() {
    if (isDevDriverPreviewEnabled()) {
      const previewDriver = await fetchPreviewDriverContext()
      if (previewDriver) return previewDriver
      return null
    }

    const profileId = authStore.profile?.id

    if (!profileId) {
      error.value = 'Driver profile is not loaded yet.'
      return null
    }

    const { data, error: driverError } = await supabase
      .from('drivers')
      .select('id, company_id, license_class, status, user_id')
      .eq('user_id', profileId)
      .eq('status', 'active')
      .maybeSingle()

    if (driverError || !data) {
      error.value =
        driverError?.message ||
        `Active driver row was not found for profile.id ${profileId}. Expected drivers.user_id to match this profile.`
      return null
    }

    currentDriver.value = data
    currentDriverProfileId.value = profileId
    return data
  }

  async function fetchAllowedVehicleTypeIds(driver: any) {
    if (isDevDriverPreviewEnabled()) {
      const { data, error: typesError } = await supabase
        .from('vehicles')
        .select('vehicle_type_id')
        .eq('company_id', driver.company_id)
        .not('vehicle_type_id', 'is', null)

      if (typesError) {
        error.value = typesError.message
        return []
      }

      return [...new Set((data || []).map((row: any) => row.vehicle_type_id).filter(Boolean))]
    }

    if (!driver.license_class) return []

    const { data, error: ruleError } = await supabase
      .from('license_vehicle_type_rules')
      .select('vehicle_type_id')
      .eq('company_id', driver.company_id)
      .eq('license_class', driver.license_class)

    if (ruleError) {
      error.value = ruleError.message
      return []
    }

    return (data || []).map((rule) => rule.vehicle_type_id)
  }

  async function fetchAllCompanyVehicleTypeIds(companyId: string) {
    const { data, error: typesError } = await supabase
      .from('vehicles')
      .select('vehicle_type_id')
      .eq('company_id', companyId)
      .not('vehicle_type_id', 'is', null)

    if (typesError) {
      error.value = typesError.message
      return []
    }

    return [...new Set((data || []).map((row: any) => row.vehicle_type_id).filter(Boolean))]
  }

  async function fetchDriverVehicles() {
    loading.value = true
    error.value = null
    const driver = await fetchDriverContext()
    const allowedTypeIds = driver ? await fetchAllowedVehicleTypeIds(driver) : []
    const fallbackTypeIds =
      !allowedTypeIds.length && driver && isDevDriverPreviewEnabled()
        ? await fetchAllCompanyVehicleTypeIds(driver.company_id)
        : []
    const effectiveTypeIds = allowedTypeIds.length ? allowedTypeIds : fallbackTypeIds

    if (!driver || !effectiveTypeIds.length) {
      vehicles.value = []
      annotatedVehicles.value = []
      filteredVehicles.value = []
      total.value = 0
      loading.value = false
      return
    }

    const { data, error: vehicleError } = await runVehicleQuery<any[]>((selectClause) =>
      supabase
        .from('vehicles')
        .select(selectClause)
        .eq('company_id', driver.company_id)
        .in('vehicle_type_id', effectiveTypeIds)
        .not('status', 'in', '(blocked,inactive,in-repair)')
        .order('created_at', { ascending: false })
    )

    if (vehicleError) {
      error.value = vehicleError.message
      vehicles.value = []
      annotatedVehicles.value = []
      filteredVehicles.value = []
      total.value = 0
      loading.value = false
      return
    }

    const driverAssignment = await fetchNormalizedActiveDriverAssignment(driver)
    activeAssignment.value = driverAssignment
    const preTripReadiness = await fetchPreTripReadiness(driver.id, (data || []).map((vehicle) => vehicle.id))
    const annotated = await annotateVehicles(
      data || [],
      driver.id,
      driverAssignment?.vehicle_id || null,
      preTripReadiness.readyVehicleIds,
      preTripReadiness.unresolvedVehicleIds
    )
    const filtered = filterVehicles(annotated)
    annotatedVehicles.value = annotated
    filteredVehicles.value = filtered
    total.value = filtered.length
    vehicles.value = paginate(filtered)
    loading.value = false
  }

  async function fetchDriverVehicleById(id: string) {
    loading.value = true
    error.value = null
    const driver = await fetchDriverContext()
    const allowedTypeIds = driver ? await fetchAllowedVehicleTypeIds(driver) : []
    const fallbackTypeIds =
      !allowedTypeIds.length && driver && isDevDriverPreviewEnabled()
        ? await fetchAllCompanyVehicleTypeIds(driver.company_id)
        : []
    const effectiveTypeIds = allowedTypeIds.length ? allowedTypeIds : fallbackTypeIds

    if (!driver || !effectiveTypeIds.length) {
      selectedVehicle.value = null
      loading.value = false
      return
    }

    const { data, error: vehicleError } = await runVehicleQuery<any | null>((selectClause) =>
      supabase
        .from('vehicles')
        .select(selectClause)
        .eq('id', id)
        .eq('company_id', driver.company_id)
        .in('vehicle_type_id', effectiveTypeIds)
        .not('status', 'in', '(blocked,inactive,in-repair)')
        .maybeSingle()
    )

    if (vehicleError || !data) {
      error.value = vehicleError?.message || 'Vehicle is not available to this driver'
      selectedVehicle.value = null
      loading.value = false
      return
    }

    const driverAssignment = await fetchNormalizedActiveDriverAssignment(driver)
    activeAssignment.value = driverAssignment
    const preTripReadiness = await fetchPreTripReadiness(driver.id, [data.id])
    selectedVehicle.value =
      (await annotateVehicles(
        [data],
        driver.id,
        driverAssignment?.vehicle_id || null,
        preTripReadiness.readyVehicleIds,
        preTripReadiness.unresolvedVehicleIds
      ))[0] ||
      null
    loading.value = false
  }

  async function fetchActiveDriverAssignment(driverId: string) {
    const { data, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .select('id, vehicle_id, driver_id, status, start_at, end_at')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .is('end_at', null)
      .limit(1)
      .maybeSingle()

    if (assignmentError) {
      error.value = assignmentError.message
      return null
    }

    return data
  }

  async function fetchNormalizedActiveDriverAssignment(driver: any) {
    const driverAssignment = await fetchActiveDriverAssignment(driver.id)
    if (!driverAssignment) return null

    const hasPreTripDraftOrSubmitted = await hasPreTripInspection(
      driver.id,
      driverAssignment.vehicle_id,
      ['draft', 'submitted']
    )

    if (!hasPreTripDraftOrSubmitted) {
      await cancelVehicleAssignment(driverAssignment.id)
      return null
    }

    const hasUnresolvedIssues = await hasUnresolvedPreTripIssues(driver.id, driverAssignment.vehicle_id)
    if (hasUnresolvedIssues) {
      await cancelVehicleAssignment(driverAssignment.id)
      return null
    }

    return driverAssignment
  }

  async function fetchSubmittedPreTripVehicleIds(driverId: string, vehicleIds?: string[]) {
    let query = supabase
      .from('inspections')
      .select('vehicle_id')
      .eq('driver_id', driverId)
      .eq('type', 'pre-trip')
      .eq('status', 'submitted')

    if (vehicleIds?.length) query = query.in('vehicle_id', vehicleIds)

    const { data, error: inspectionError } = await query

    if (inspectionError) {
      error.value = inspectionError.message
      return new Set<string>()
    }

    return new Set((data || []).map((inspection) => inspection.vehicle_id).filter(Boolean))
  }

  async function hasSubmittedPreTrip(driverId: string, vehicleId: string) {
    const submittedVehicleIds = await fetchSubmittedPreTripVehicleIds(driverId, [vehicleId])
    return submittedVehicleIds.has(vehicleId)
  }

  async function fetchPreTripReadiness(driverId: string, vehicleIds?: string[]) {
    const submittedVehicleIds = await fetchSubmittedPreTripVehicleIds(driverId, vehicleIds)
    const unresolvedVehicleIds = new Set<string>()

    if (!submittedVehicleIds.size) {
      return { readyVehicleIds: submittedVehicleIds, unresolvedVehicleIds }
    }

    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select('id, vehicle_id')
      .eq('driver_id', driverId)
      .eq('type', 'pre-trip')
      .eq('status', 'submitted')
      .in('vehicle_id', [...submittedVehicleIds])

    if (inspectionsError) {
      error.value = inspectionsError.message
      return { readyVehicleIds: new Set<string>(), unresolvedVehicleIds }
    }

    const inspectionIds = (inspections || []).map((inspection) => inspection.id)
    if (!inspectionIds.length) {
      return { readyVehicleIds: submittedVehicleIds, unresolvedVehicleIds }
    }

    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('inspection_id, vehicle_id, status')
      .in('inspection_id', inspectionIds)
      .in('status', unresolvedIssueStatuses)

    if (issuesError) {
      error.value = issuesError.message
      return { readyVehicleIds: new Set<string>(), unresolvedVehicleIds }
    }

    for (const issue of issues || []) {
      if (issue.vehicle_id) unresolvedVehicleIds.add(issue.vehicle_id)
    }

    const readyVehicleIds = new Set(
      [...submittedVehicleIds].filter((vehicleId) => !unresolvedVehicleIds.has(vehicleId))
    )

    return { readyVehicleIds, unresolvedVehicleIds }
  }

  async function hasUnresolvedPreTripIssues(driverId: string, vehicleId: string) {
    const readiness = await fetchPreTripReadiness(driverId, [vehicleId])
    return readiness.unresolvedVehicleIds.has(vehicleId)
  }

  async function hasPreTripInspection(driverId: string, vehicleId: string, statuses: string[]) {
    const { data, error: inspectionError } = await supabase
      .from('inspections')
      .select('id')
      .eq('driver_id', driverId)
      .eq('vehicle_id', vehicleId)
      .eq('type', 'pre-trip')
      .in('status', statuses)
      .limit(1)
      .maybeSingle()

    if (inspectionError) {
      error.value = inspectionError.message
      return false
    }

    return Boolean(data)
  }

  async function annotateVehicles(
    rows: any[],
    driverId: string,
    driverActiveVehicleId?: string | null,
    readyPreTripVehicleIds = new Set<string>(),
    unresolvedPreTripVehicleIds = new Set<string>()
  ) {
    const vehicleIds = rows.map((vehicle) => vehicle.id)
    if (!vehicleIds.length) return []

    const [{ data: assignments, error: assignmentError }, { data: repairs, error: repairError }] =
      await Promise.all([
        supabase
          .from('vehicle_assignments')
          .select('id, vehicle_id, driver_id, status, start_at, end_at')
          .in('vehicle_id', vehicleIds)
          .eq('status', 'active')
          .is('end_at', null),
        supabase
          .from('repairs')
          .select('id, vehicle_id, status')
          .in('vehicle_id', vehicleIds)
          .in('status', ['open', 'in-progress']),
      ])

    if (assignmentError) error.value = assignmentError.message
    if (repairError) error.value = repairError.message

    const assignmentByVehicle = new Map(
      (assignments || []).map((assignment) => [assignment.vehicle_id, assignment])
    )
    const repairIds = new Set((repairs || []).map((repair) => repair.vehicle_id))

    return rows.map((vehicle) => {
      const activeAssignment = assignmentByVehicle.get(vehicle.id)
      const assignedToMe = activeAssignment?.driver_id === driverId
      const assignedToOther = Boolean(activeAssignment && !assignedToMe)
      const awaitingManagerReview = unresolvedPreTripVehicleIds.has(vehicle.id)
      const postTripReady = assignedToMe && readyPreTripVehicleIds.has(vehicle.id) && !awaitingManagerReview
      const inActiveRepair = repairIds.has(vehicle.id)
      const lockedByCurrentAssignment = Boolean(
        driverActiveVehicleId && vehicle.id !== driverActiveVehicleId
      )
      const unavailableStatus = ['needs-attention', 'blocked', 'inactive', 'in-repair'].includes(
        vehicle.status
      )
      const available =
        !assignedToMe &&
        !assignedToOther &&
        !inActiveRepair &&
        !awaitingManagerReview &&
        !unavailableStatus &&
        !lockedByCurrentAssignment

      return {
        ...vehicle,
        active_assignment: activeAssignment || null,
        assigned_to_me: assignedToMe,
        post_trip_ready: postTripReady,
        awaiting_manager_review: awaitingManagerReview,
        assigned_to_other: assignedToOther,
        locked_by_current_assignment: lockedByCurrentAssignment,
        in_active_repair: inActiveRepair,
        available,
        availability: assignedToMe
          ? 'assigned'
          : awaitingManagerReview
          ? 'unavailable'
          : lockedByCurrentAssignment
          ? 'unavailable'
          : inActiveRepair
          ? 'repair'
          : available
          ? 'available'
          : 'unavailable',
      }
    })
  }

  function filterVehicles(rows: any[]) {
    const searchValue = search.value.trim().toLowerCase()
    return rows.filter((vehicle) => {
      const matchesSearch =
        !searchValue ||
        [vehicle.unit, vehicle.make, vehicle.model, vehicle.plate, vehicle.vehicle_types?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchValue))
      const matchesFilter =
        availabilityFilter.value === 'all' ||
        (availabilityFilter.value === 'assigned' && vehicle.assigned_to_me) ||
        (availabilityFilter.value === 'available' && vehicle.available) ||
        (availabilityFilter.value === 'repair' && vehicle.in_active_repair) ||
        (availabilityFilter.value === 'unavailable' && !vehicle.available && !vehicle.assigned_to_me)

      return matchesSearch && matchesFilter
    })
  }

  function isDriverVehicleAvailable(vehicle: any) {
    return vehicle.status === 'active' && vehicle.available === true
  }

  function isDriverVehicleInspectable(vehicle: any) {
    return (
      vehicle.status === 'active' &&
      !vehicle.in_active_repair &&
      !vehicle.awaiting_manager_review &&
      !vehicle.assigned_to_other &&
      (vehicle.available === true || vehicle.assigned_to_me === true)
    )
  }

  function paginate(rows: any[]) {
    const from = (page.value - 1) * pageSize.value
    return rows.slice(from, from + pageSize.value)
  }

  async function createVehicleAssignmentIfNeeded(vehicleId: string) {
    const driver = await fetchDriverContext()
    if (!driver) return false

    const driverAssignment = await fetchActiveDriverAssignment(driver.id)
    if (driverAssignment && driverAssignment.vehicle_id !== vehicleId) {
      error.value =
        'You already have an active vehicle assignment. Submit the post-trip inspection before choosing another vehicle.'
      return false
    }

    const { data: existing, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .select('id, driver_id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'active')
      .is('end_at', null)
      .maybeSingle()

    if (assignmentError) {
      error.value = assignmentError.message
      return false
    }

    if (existing?.driver_id === driver.id) return true
    if (existing) {
      error.value = 'Vehicle is already assigned to another driver'
      return false
    }

    const { error: insertError } = await supabase.from('vehicle_assignments').insert({
      company_id: driver.company_id,
      vehicle_id: vehicleId,
      driver_id: driver.id,
      start_at: new Date().toISOString(),
      status: 'active',
    })

    if (insertError) {
      error.value = insertError.message
      return false
    }

    activeAssignment.value = {
      vehicle_id: vehicleId,
      driver_id: driver.id,
      status: 'active',
      start_at: new Date().toISOString(),
      end_at: null,
    }
    return true
  }

  async function closeVehicleAssignment(vehicleId: string) {
    const driver = await fetchDriverContext()
    if (!driver) return false

    const { error: closeError } = await supabase
      .from('vehicle_assignments')
      .update({
        status: 'completed',
        end_at: new Date().toISOString(),
      })
      .eq('vehicle_id', vehicleId)
      .eq('driver_id', driver.id)
      .eq('status', 'active')
      .is('end_at', null)

    if (closeError) {
      error.value = closeError.message
      return false
    }

    if (activeAssignment.value?.vehicle_id === vehicleId) activeAssignment.value = null
    return true
  }

  async function cancelVehicleAssignment(assignmentId: string) {
    const { error: cancelError } = await supabase
      .from('vehicle_assignments')
      .update({
        status: 'cancelled',
        end_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .eq('status', 'active')
      .is('end_at', null)

    if (cancelError) {
      error.value = cancelError.message
      return false
    }

    if (activeAssignment.value?.id === assignmentId) activeAssignment.value = null
    return true
  }

  async function startPreTripInspection(vehicleId: string) {
    const driver = await fetchDriverContext()
    if (!driver) return null

    const driverAssignment = await fetchActiveDriverAssignment(driver.id)
    if (driverAssignment) {
      const assignmentHasSubmittedPreTrip = await hasSubmittedPreTrip(
        driver.id,
        driverAssignment.vehicle_id
      )
      const assignmentHasDraftPreTrip = await hasPreTripInspection(
        driver.id,
        driverAssignment.vehicle_id,
        ['draft']
      )

      if (assignmentHasSubmittedPreTrip) {
        const hasUnresolvedIssues = await hasUnresolvedPreTripIssues(driver.id, driverAssignment.vehicle_id)
        if (hasUnresolvedIssues) {
          await cancelVehicleAssignment(driverAssignment.id)
          error.value = 'Manager review is required before starting another inspection for this vehicle.'
          return null
        }

        error.value =
          driverAssignment.vehicle_id === vehicleId
            ? 'This vehicle is already assigned to you. Complete the post-trip inspection to release it.'
            : 'Submit the post-trip inspection for your assigned vehicle before choosing another vehicle.'
        return null
      }

      if (assignmentHasDraftPreTrip) {
        error.value = 'Continue your draft pre-trip inspection from Driver Reports before starting another inspection.'
        return null
      }

      await cancelVehicleAssignment(driverAssignment.id)
    }

    const hasUnresolvedIssues = await hasUnresolvedPreTripIssues(driver.id, vehicleId)
    if (hasUnresolvedIssues) {
      error.value = 'Manager review is required before starting another inspection for this vehicle.'
      return null
    }

    const inspectionId = await createInspection(vehicleId, 'pre-trip')
    return inspectionId
  }

  async function startPostTripInspection(vehicleId: string) {
    const driver = await fetchDriverContext()

    if (!driver) return null

    const driverAssignment = await fetchActiveDriverAssignment(driver.id)
    activeAssignment.value = driverAssignment

    if (!driverAssignment || driverAssignment.vehicle_id !== vehicleId) {
      error.value = 'Post-trip inspection requires a vehicle assigned to you'
      return null
    }

    const assignmentHasSubmittedPreTrip = await hasSubmittedPreTrip(driver.id, vehicleId)
    if (!assignmentHasSubmittedPreTrip) {
      error.value = 'Submit a pre-trip inspection before starting post-trip.'
      return null
    }

    const hasUnresolvedIssues = await hasUnresolvedPreTripIssues(driver.id, vehicleId)
    if (hasUnresolvedIssues) {
      error.value = 'Manager review required before post-trip.'
      return null
    }

    return createInspection(vehicleId, 'post-trip')
  }

  async function createInspection(vehicleId: string, type: InspectionType) {
    const driver = await fetchActiveDriverForInspection()
    const vehicle =
      selectedVehicle.value?.id === vehicleId
        ? selectedVehicle.value
        : vehicles.value.find((row) => row.id === vehicleId) ||
          (driver ? await fetchVehicleForInspection(driver, vehicleId) : null)

    if (!driver || !vehicle) return null

    const existingDraftId = await findExistingDraftInspection(driver.id, vehicleId, type)
    if (existingDraftId) return existingDraftId

    const template = await findTemplateForVehicleType(
      driver.company_id,
      vehicle.vehicle_type_id,
      type
    )

    if (!template) {
      error.value = 'No inspection template found for this vehicle type and inspection mode'
      return null
    }

    const latestCommittedOdometer = await fetchLatestCommittedInspectionOdometer(vehicleId)
    const odometerFloor = await fetchVehicleOdometerFloor(vehicleId)

    const inspectionPayload = {
      company_id: driver.company_id,
      vehicle_id: vehicleId,
      driver_id: driver.id,
      template_id: template.id,
      type,
      status: 'draft',
      odometer: odometerFloor ?? latestCommittedOdometer ?? vehicle.odometer ?? null,
      engine_hours: vehicle.engine_hours ?? null,
    }

    console.log('[driverVehicleStore] creating inspection payload', inspectionPayload)

    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert(inspectionPayload)
      .select('id')
      .single()

    if (inspectionError || !inspection) {
      error.value = inspectionError?.message || 'Inspection could not be started'
      return null
    }

    const items = template.inspection_template_items || []
    if (items.length) {
      const { error: resultsError } = await supabase.from('inspection_results').insert(
        items.map((item: any) => ({
          inspection_id: inspection.id,
          template_item_id: item.id,
          result: null,
          comment: null,
          photo_urls: [],
        }))
      )

      if (resultsError) {
        error.value = resultsError.message
        await deleteInspectionDraft(inspection.id)
        return null
      }
    }

    return inspection.id as string
  }

  async function fetchLatestCommittedInspectionOdometer(vehicleId: string) {
    const { data, error: odometerError } = await supabase
      .from('inspections')
      .select('odometer, submitted_at, created_at')
      .eq('vehicle_id', vehicleId)
      .in('status', ['submitted', 'approved', 'needs-review', 'rejected'])
      .not('odometer', 'is', null)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (odometerError) {
      error.value = odometerError.message
      return null
    }

    return data?.odometer != null ? Number(data.odometer) : null
  }

  async function fetchVehicleOdometerFloor(vehicleId: string, exceptInspectionId?: string) {
    let maxInspectionQuery = supabase
      .from('inspections')
      .select('odometer')
      .eq('vehicle_id', vehicleId)
      .not('odometer', 'is', null)
      .order('odometer', { ascending: false })
      .limit(1)

    if (exceptInspectionId) {
      maxInspectionQuery = maxInspectionQuery.neq('id', exceptInspectionId)
    }

    const [maxInspectionResult, vehicleResult] = await Promise.all([
      maxInspectionQuery.maybeSingle(),
      supabase.from('vehicles').select('odometer').eq('id', vehicleId).maybeSingle(),
    ])

    if (maxInspectionResult.error) {
      error.value = maxInspectionResult.error.message
      return null
    }

    if (vehicleResult.error) {
      error.value = vehicleResult.error.message
      return null
    }

    const candidates = [
      maxInspectionResult.data?.odometer != null ? Number(maxInspectionResult.data.odometer) : null,
      vehicleResult.data?.odometer != null ? Number(vehicleResult.data.odometer) : null,
    ].filter((value): value is number => Number.isFinite(value))

    return candidates.length ? Math.max(...candidates) : null
  }

  async function fetchPreviewDriverContext() {
    const companyId = authStore.companyId

    if (!companyId) {
      error.value = 'Driver preview mode requires an active company in your account.'
      return null
    }

    const { data, error: previewError } = await supabase
      .from('drivers')
      .select('id, company_id, license_class, status, user_id')
      .eq('company_id', companyId)
      .in('status', ['active', 'pending', 'new'])
      .order('created_at', { ascending: true })
      .limit(50)

    if (previewError || !data?.length) {
      error.value = previewError?.message || 'Driver preview mode: no driver found for this company.'
      currentDriver.value = null
      return null
    }

    const rank = (status: string) =>
      status === 'active' ? 0 : status === 'pending' ? 1 : 2

    const selected = [...data].sort(
      (a: any, b: any) => rank(a.status) - rank(b.status)
    )[0]

    currentDriver.value = selected
    currentDriverProfileId.value = authStore.profile?.id || null
    return selected
  }

  async function findExistingDraftInspection(driverId: string, vehicleId: string, type: InspectionType) {
    const { data, error: draftError } = await supabase
      .from('inspections')
      .select('id')
      .eq('driver_id', driverId)
      .eq('vehicle_id', vehicleId)
      .eq('type', type)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (draftError) {
      error.value = draftError.message
      return null
    }

    return data?.id || null
  }

  async function deleteInspectionDraft(inspectionId: string) {
    await supabase.from('inspections').delete().eq('id', inspectionId).eq('status', 'draft')
  }

  async function fetchVehicleForInspection(driver: any, vehicleId: string) {
    const allowedTypeIds = await fetchAllowedVehicleTypeIds(driver)
    if (!allowedTypeIds.length) return null

    const { data, error: vehicleError } = await runVehicleQuery<any | null>((selectClause) =>
      supabase
        .from('vehicles')
        .select(selectClause)
        .eq('id', vehicleId)
        .eq('company_id', driver.company_id)
        .in('vehicle_type_id', allowedTypeIds)
        .maybeSingle()
    )

    if (vehicleError || !data) {
      error.value = vehicleError?.message || 'Vehicle is not available to this driver'
      return null
    }

    return data
  }

  async function findTemplateForVehicleType(
    companyId: string,
    vehicleTypeId: string,
    inspectionMode?: InspectionType
  ) {
    const { data, error: templateError } = await supabase
      .from('inspection_templates')
      .select(`
        id,
        inspection_mode,
        inspection_template_items (
          id,
          sort_order
        )
      `)
      .eq('company_id', companyId)
      .eq('vehicle_type_id', vehicleTypeId)
      .order('created_at', { ascending: false })

    if (templateError) {
      error.value = templateError.message
      return null
    }

    const templates = Array.isArray(data) ? data : data ? [data] : []

    if (!templates.length) return null

    if (!inspectionMode) return templates[0]

    const matchedTemplate = templates.find((template: any) => template.inspection_mode === inspectionMode)

    return matchedTemplate || templates[0]
  }

  async function completeInspection(
    inspectionId: string,
    vehicleId: string,
    type: InspectionType,
    hasFailedItems = false,
    signatureDataUrl: string | null = null,
    odometerReading: number | null = null
  ) {
    const driver = await fetchDriverContext()
    if (!driver) return false

    if (typeof odometerReading === 'number') {
      const odometerFloor = await fetchVehicleOdometerFloor(vehicleId, inspectionId)
      if (odometerFloor != null && odometerReading < odometerFloor) {
        error.value = `Odometer cannot be lower than ${odometerFloor}.`
        return false
      }
    }

    const baseUpdate = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      odometer: odometerReading,
    }

    const signatureUpdate = {
      ...baseUpdate,
      signature_data_url: signatureDataUrl,
      signed_at: signatureDataUrl ? new Date().toISOString() : null,
      signed_by_driver_id: signatureDataUrl ? driver.id : null,
    }

    const signatureTimestamp = new Date().toISOString()

    if (signatureDataUrl) {
      const fallbackPayload = {
        company_id: driver.company_id,
        inspection_id: inspectionId,
        driver_id: driver.id,
        signature_data_url: signatureDataUrl,
        signed_at: signatureTimestamp,
      }

      const { error: fallbackUpsertError } = await supabase
        .from('inspection_signature_fallbacks')
        .upsert(
          fallbackPayload,
          { onConflict: 'inspection_id' }
        )

      if (fallbackUpsertError) {
        console.warn('[driverVehicleStore] shared signature fallback upsert failed', fallbackUpsertError)

        if (isMissingOnConflictConstraintError(fallbackUpsertError.message)) {
          const { error: fallbackInsertError } = await supabase
            .from('inspection_signature_fallbacks')
            .insert(fallbackPayload)

          if (fallbackInsertError) {
            console.warn('[driverVehicleStore] shared signature fallback insert failed', fallbackInsertError)
          }
        }
      }
    }

    let { error: inspectionError } = await supabase
      .from('inspections')
      .update(signatureUpdate)
      .eq('id', inspectionId)

    if (inspectionError && isMissingSignatureColumnsError(inspectionError.message)) {
      if (signatureDataUrl) {
        saveSignatureFallback(inspectionId, signatureDataUrl, signatureTimestamp, driver.id)
      }
      const retry = await supabase
        .from('inspections')
        .update(baseUpdate)
        .eq('id', inspectionId)
      inspectionError = retry.error
    }

    if (!inspectionError && signatureDataUrl) {
      saveSignatureFallback(inspectionId, signatureDataUrl, signatureTimestamp, driver.id)
    }

    if (inspectionError) {
      error.value = inspectionError.message
      return false
    }

    if (typeof odometerReading === 'number') {
      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({ odometer: odometerReading })
        .eq('id', vehicleId)

      if (vehicleUpdateError) {
        // Some environments keep vehicles update restricted for drivers.
        // The inspection odometer is already saved above and is the source of truth.
        console.warn('[driverVehicleStore] vehicle odometer update skipped', vehicleUpdateError)
      }
    }

    if (type === 'post-trip') return closeVehicleAssignment(vehicleId)

    const hasUnresolvedIssues = hasFailedItems || await hasUnresolvedPreTripIssues(driver.id, vehicleId)

    if (hasUnresolvedIssues) {
      const assignment = await fetchActiveDriverAssignment(driver.id)
      if (assignment?.vehicle_id === vehicleId) await cancelVehicleAssignment(assignment.id)
      return true
    }

    return createVehicleAssignmentIfNeeded(vehicleId)
  }

  async function setSearch(value: string) {
    search.value = value
    page.value = 1
    await fetchDriverVehicles()
  }

  async function setAvailabilityFilter(value: AvailabilityFilter) {
    availabilityFilter.value = value
    page.value = 1
    await fetchDriverVehicles()
  }

  async function setPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages.value) return
    page.value = nextPage
    await fetchDriverVehicles()
  }

  async function setPageSize(nextPageSize: number) {
    pageSize.value = nextPageSize
    page.value = 1
    await fetchDriverVehicles()
  }

  return {
    vehicles,
    annotatedVehicles,
    filteredVehicles,
    availableVehicles,
    inspectableVehicles,
    selectedVehicle,
    currentDriver,
    activeAssignment,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    search,
    availabilityFilter,
    fetchDriverContext,
    fetchDriverVehicles,
    fetchDriverVehicleById,
    startPreTripInspection,
    startPostTripInspection,
    createVehicleAssignmentIfNeeded,
    closeVehicleAssignment,
    completeInspection,
    fetchVehicleOdometerFloor,
    setSearch,
    setAvailabilityFilter,
    setPage,
    setPageSize,
    isDriverVehicleAvailable,
    isDriverVehicleInspectable,
  }
})
