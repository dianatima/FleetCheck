import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export const useVehicleStore = defineStore('vehicles', () => {
  const authStore = useAuthStore()
  const vehicles = ref<any[]>([])
  const sourceVehicles = ref<any[]>([])
  const vehicleTypes = ref<any[]>([])
  const assignmentDriverOptions = ref<any[]>([])
  const selectedVehicle = ref<any | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const search = ref('')
  const statusFilter = ref('all')
  const assignedFilter = ref('all')
  const typeFilter = ref('all')
  const brandFilter = ref('all')
  const statusCounts = ref<Record<string, number>>({
    active: 0,
    'needs-attention': 0,
    blocked: 0,
    'in-repair': 0,
    assigned: 0,
  })
  const hasOdometerUnitColumn = ref(true)

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(total.value / pageSize.value))
  })

  const brandOptions = computed(() =>
    [...new Set(sourceVehicles.value.map((vehicle) => vehicle.make).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b)))
  )

  const vehicleSelect = `
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

  const vehicleSelectLegacy = `
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
    return String(message || '').toLowerCase().includes('odometer_unit')
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

  function getVehicleSelect() {
    return hasOdometerUnitColumn.value ? vehicleSelect : vehicleSelectLegacy
  }

  async function runVehicleQuery<T>(
    build: (selectClause: string) => Promise<{ data: T; error: any }>
  ) {
    let { data, error } = await build(getVehicleSelect())

    if (error && isMissingOdometerUnitColumnError(error.message)) {
      hasOdometerUnitColumn.value = false
      const retry = await build(vehicleSelectLegacy)
      data = retry.data
      error = retry.error
    }

    return {
      data: withDefaultOdometerUnit(data),
      error,
    }
  }

  async function fetchVehicles() {
    loading.value = true
    error.value = null

    const from = (page.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
      
    if (!authStore.companyId) {
        vehicles.value = []
        sourceVehicles.value = []
        total.value = 0
        statusCounts.value = {
          active: 0,
          'needs-attention': 0,
          blocked: 0,
          'in-repair': 0,
          assigned: 0,
        }
        assignmentDriverOptions.value = []
        loading.value = false
        return
    }

    const { data, error: supabaseError } = await runVehicleQuery((selectClause) =>
      supabase
        .from('vehicles')
        .select(selectClause)
        .eq('company_id', authStore.companyId)
        .order('created_at', { ascending: false })
    )

    if (supabaseError) {
      error.value = supabaseError.message
      vehicles.value = []
      sourceVehicles.value = []
      total.value = 0
    } else {
      const enriched = await attachAssignments(data || [])
      sourceVehicles.value = enriched
      assignmentDriverOptions.value = await fetchAssignmentDriverOptions(
        (data || []).map((vehicle) => vehicle.id)
      )
      const filtered = filterVehicles(enriched)
      updateStatusCounts(enriched)
      total.value = filtered.length
      vehicles.value = filtered.slice(from, to + 1)
    }

    loading.value = false
  }

  async function attachAssignments(rows: any[]) {
    if (!rows.length || !authStore.companyId) return rows

    const vehicleIds = rows.map((vehicle) => vehicle.id)
    const { data: assignments, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .select(`
        id,
        vehicle_id,
        driver_id,
        status,
        start_at,
        end_at,
        drivers (
          id,
          name
        )
      `)
      .eq('status', 'active')
      .in('vehicle_id', vehicleIds)

    if (assignmentError) {
      error.value = assignmentError.message
      return rows.map((vehicle) => ({ ...vehicle, active_assignment: null }))
    }

    const assignmentByVehicle = new Map(
      (assignments || []).map((assignment) => [assignment.vehicle_id, assignment])
    )

    return rows.map((vehicle) => ({
      ...vehicle,
      active_assignment: assignmentByVehicle.get(vehicle.id) || null,
    }))
  }

  async function fetchAssignmentDriverOptions(vehicleIds: string[]) {
    if (!vehicleIds.length) return []

    const { data, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .select(`
        driver_id,
        drivers (
          id,
          name
        )
      `)
      .in('vehicle_id', vehicleIds)

    if (assignmentError) {
      console.error('[vehicleStore] failed to load assignment drivers', assignmentError)
      return []
    }

    const byId = new Map<string, any>()

    for (const assignment of data || []) {
      const driver = Array.isArray(assignment.drivers) ? assignment.drivers[0] : assignment.drivers
      if (driver?.id) byId.set(driver.id, driver)
    }

    return [...byId.values()].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''))
    )
  }

  async function findVehicleTypeIds(name: string) {
    const { data, error: supabaseError } = await supabase
      .from('vehicle_types')
      .select('id')
      .ilike('name', `%${name}%`)

    if (supabaseError) {
      error.value = supabaseError.message
      return []
    }

    return (data || []).map((vehicleType) => vehicleType.id)
  }

  function vehicleSearchExpression(searchValue: string, matchingTypeIds: string[]) {
    const filters = [
      `unit.ilike.%${searchValue}%`,
      `make.ilike.%${searchValue}%`,
      `model.ilike.%${searchValue}%`,
      `plate.ilike.%${searchValue}%`,
    ]

    if (matchingTypeIds.length) {
      filters.push(`vehicle_type_id.in.(${matchingTypeIds.join(',')})`)
    }

    return filters.join(',')
  }

  function updateStatusCounts(rows = sourceVehicles.value) {
    statusCounts.value = {
      active: rows.filter((vehicle) => vehicle.status === 'active').length,
      'needs-attention': rows.filter((vehicle) => vehicle.status === 'needs-attention').length,
      blocked: rows.filter((vehicle) => vehicle.status === 'blocked').length,
      'in-repair': rows.filter((vehicle) => vehicle.status === 'in-repair').length,
      assigned: rows.filter((vehicle) => Boolean(vehicle.active_assignment)).length,
    }
  }

  function filterVehicles(rows = sourceVehicles.value) {
    const searchValue = search.value.trim().toLowerCase()

    return rows.filter((vehicle) => {
      const activeAssignment = vehicle.active_assignment
      const driver = relation(activeAssignment?.drivers)
      const matchesSearch =
        !searchValue ||
        [
          vehicle.unit,
          vehicle.make,
          vehicle.model,
          vehicle.plate,
          vehicle.vin,
          vehicle.vehicle_types?.name,
          driver?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchValue))

      const matchesStatus = statusFilter.value === 'all' || vehicle.status === statusFilter.value
      const matchesAssigned =
        assignedFilter.value === 'all' ||
        (assignedFilter.value === 'assigned' && Boolean(activeAssignment)) ||
        (assignedFilter.value === 'unassigned' && !activeAssignment) ||
        activeAssignment?.driver_id === assignedFilter.value
      const matchesType = typeFilter.value === 'all' || vehicle.vehicle_type_id === typeFilter.value
      const matchesBrand = brandFilter.value === 'all' || vehicle.make === brandFilter.value

      return matchesSearch && matchesStatus && matchesAssigned && matchesType && matchesBrand
    })
  }

  async function fetchVehicleTypes() {
    const { data, error: supabaseError } = await supabase
      .from('vehicle_types')
      .select('id, name')
      .order('name', { ascending: true })

    if (supabaseError) {
      error.value = supabaseError.message
      vehicleTypes.value = []
      return false
    }

    vehicleTypes.value = data || []
    return true
  }

  async function setSearch(value: string) {
    search.value = value
    page.value = 1
    await fetchVehicles()
  }

  async function setStatusFilter(value: string) {
    statusFilter.value = value
    page.value = 1
    await fetchVehicles()
  }

  async function setAssignedFilter(value: string) {
    assignedFilter.value = value
    page.value = 1
    await fetchVehicles()
  }

  async function setTypeFilter(value: string) {
    typeFilter.value = value
    page.value = 1
    await fetchVehicles()
  }

  async function setBrandFilter(value: string) {
    brandFilter.value = value
    page.value = 1
    await fetchVehicles()
  }

  async function setPage(newPage: number) {
    if (newPage < 1 || newPage > totalPages.value) return

    page.value = newPage
    await fetchVehicles()
  }

  async function nextPage() {
    await setPage(page.value + 1)
  }

  async function prevPage() {
    await setPage(page.value - 1)
  }

  async function setPageSize(size: number) {
    pageSize.value = size
    page.value = 1
    await fetchVehicles()
  }

  async function createVehicle(vehicle: any) {
    loading.value = true
    error.value = null
  
    if (!authStore.companyId) {
      error.value = 'Company ID is missing'
      loading.value = false
      return false
    }

    const payload = normalizeVehiclePayload(vehicle, true)
    if (!payload) {
      loading.value = false
      return false
    }
  
    let { error: supabaseError } = await supabase
      .from('vehicles')
      .insert({
        ...payload,
        company_id: authStore.companyId,
      })

    if (supabaseError && isMissingOdometerUnitColumnError(supabaseError.message)) {
      hasOdometerUnitColumn.value = false
      const fallbackPayload = { ...payload }
      delete fallbackPayload.odometer_unit
      const retry = await supabase
        .from('vehicles')
        .insert({
          ...fallbackPayload,
          company_id: authStore.companyId,
        })
      supabaseError = retry.error
    }
  
    if (supabaseError) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }
  
    await fetchVehicles()
    loading.value = false
    return true
  }

  async function updateVehicle(id: string, vehicle: any) {
    loading.value = true
    error.value = null

    const payload = normalizeVehiclePayload(vehicle, false)
    if (!payload) {
      loading.value = false
      return false
    }

    let { error: supabaseError } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (supabaseError && isMissingOdometerUnitColumnError(supabaseError.message)) {
      hasOdometerUnitColumn.value = false
      const fallbackPayload = { ...payload }
      delete fallbackPayload.odometer_unit
      const retry = await supabase
        .from('vehicles')
        .update(fallbackPayload)
        .eq('id', id)
        .eq('company_id', authStore.companyId)
      supabaseError = retry.error
    }

    if (supabaseError) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }

    await fetchVehicles()

    if (selectedVehicle.value?.id === id) {
      await fetchVehicleById(id)
    }

    loading.value = false
    return true
  }

  function normalizeVehiclePayload(vehicle: any, requireVehicleType: boolean) {
    if (requireVehicleType && !vehicle?.vehicle_type_id) {
      error.value = 'Vehicle type is required'
      return null
    }

    if (
      Object.prototype.hasOwnProperty.call(vehicle || {}, 'vehicle_type_id') &&
      !vehicle.vehicle_type_id
    ) {
      error.value = 'Vehicle type is required'
      return null
    }

    const allowedFields = [
      'unit',
      'vehicle_type_id',
      'make',
      'model',
      'year',
      'plate',
      'vin',
      'odometer',
      'odometer_unit',
      'engine_hours',
      'status',
      'photo_url',
    ]
    const payload: Record<string, any> = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(vehicle || {}, field)) {
        payload[field] = vehicle[field]
      }
    }

    if (!hasOdometerUnitColumn.value) {
      delete payload.odometer_unit
    }

    return payload
  }

  async function deleteVehicle(id: string) {
    loading.value = true
    error.value = null

    const { error: supabaseError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (supabaseError) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }

    if (selectedVehicle.value?.id === id) {
      selectedVehicle.value = null
    }

    await fetchVehicles()
    loading.value = false
    return true
  }

  async function fetchVehicleById(id: string) {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await runVehicleQuery((selectClause) =>
      supabase
        .from('vehicles')
        .select(selectClause)
        .eq('id', id)
        .eq('company_id', authStore.companyId)
        .single()
    )

    if (supabaseError) {
      error.value = supabaseError.message
      selectedVehicle.value = null
    } else {
      selectedVehicle.value = (await attachAssignments([data]))[0] || data
    }

    loading.value = false
  }

  function resetFilters() {
    search.value = ''
    statusFilter.value = 'all'
    assignedFilter.value = 'all'
    typeFilter.value = 'all'
    brandFilter.value = 'all'
    page.value = 1
  }

  function relation(value: any) {
    return Array.isArray(value) ? value[0] : value
  }

  return {
    vehicles,
    sourceVehicles,
    vehicleTypes,
    assignmentDriverOptions,
    brandOptions,
    selectedVehicle,

    loading,
    error,

    page,
    pageSize,
    total,
    totalPages,

    search,
    statusFilter,
    assignedFilter,
    typeFilter,
    brandFilter,
    statusCounts,

    fetchVehicles,
    fetchVehicleTypes,
    fetchVehicleById,

    createVehicle,
    updateVehicle,
    deleteVehicle,

    setSearch,
    setStatusFilter,
    setAssignedFilter,
    setTypeFilter,
    setBrandFilter,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    resetFilters,
  }
})
