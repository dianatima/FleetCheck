import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export const useVehicleStore = defineStore('vehicles', () => {
  const authStore = useAuthStore()
  const vehicles = ref<any[]>([])
  const summaryVehicles = ref<any[]>([])
  const selectedVehicle = ref<any | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const search = ref('')
  const statusFilter = ref('all')
  const mutableVehicleFields = ['unit', 'plate', 'status', 'photo_url'] as const

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(total.value / pageSize.value))
  })

  async function fetchVehicleAssignments(companyId: string) {
    const { data, error: assignmentError } = await supabase
      .from('vehicle_company_assignments')
      .select('vehicle_id, status, assigned_driver_id, service_type, started_at, ended_at, notes, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (assignmentError) {
      throw assignmentError
    }

    return data || []
  }

  async function fetchVehiclesByIds(vehicleIds: string[]) {
    if (vehicleIds.length === 0) {
      return []
    }

    const { data, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .in('id', vehicleIds)

    if (vehiclesError) {
      throw vehiclesError
    }

    return data || []
  }

  async function ensureLegacyAssignments(companyId: string) {
    const { data: legacyVehicles, error: legacyVehiclesError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('company_id', companyId)

    if (legacyVehiclesError) {
      throw legacyVehiclesError
    }

    const legacyVehicleIds = (legacyVehicles || []).map((vehicle) => vehicle.id)

    if (legacyVehicleIds.length === 0) {
      return
    }

    const { data: currentAssignments, error: currentAssignmentsError } = await supabase
      .from('vehicle_company_assignments')
      .select('vehicle_id')
      .eq('company_id', companyId)
      .in('vehicle_id', legacyVehicleIds)

    if (currentAssignmentsError) {
      throw currentAssignmentsError
    }

    const assignedIds = new Set((currentAssignments || []).map((assignment) => assignment.vehicle_id))
    const missingAssignments = legacyVehicleIds
      .filter((vehicleId) => !assignedIds.has(vehicleId))
      .map((vehicleId) => ({
        vehicle_id: vehicleId,
        company_id: companyId,
        status: 'available',
      }))

    if (missingAssignments.length === 0) {
      return
    }

    const { error: insertAssignmentsError } = await supabase
      .from('vehicle_company_assignments')
      .insert(missingAssignments)

    if (insertAssignmentsError) {
      throw insertAssignmentsError
    }
  }

  function mergeAssignmentsWithVehicles(assignments: any[], vehicleRecords: any[]) {
    const vehicleMap = new Map(vehicleRecords.map((vehicle) => [vehicle.id, vehicle]))

    return assignments
      .map((assignment) => {
        const vehicle = vehicleMap.get(assignment.vehicle_id)
        if (!vehicle) {
          return null
        }

        return {
          ...vehicle,
          availability_status: assignment.status || vehicle.availability_status || 'available',
          active_service_type: assignment.service_type || vehicle.active_service_type || null,
          current_assignment_started_at: assignment.started_at || null,
          current_assignment_ended_at: assignment.ended_at || null,
          current_assignment_notes: assignment.notes || null,
        }
      })
      .filter(Boolean)
  }

  async function createVehicleAssignment(vehicleId: string, companyId: string) {
    const { data: existingAssignment, error: existingAssignmentError } = await supabase
      .from('vehicle_company_assignments')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (existingAssignmentError) {
      throw existingAssignmentError
    }

    if (existingAssignment?.id) {
      return existingAssignment.id
    }

    const { data, error: insertAssignmentError } = await supabase
      .from('vehicle_company_assignments')
      .insert({
        vehicle_id: vehicleId,
        company_id: companyId,
        status: 'available',
      })
      .select('id')
      .single()

    if (insertAssignmentError) {
      throw insertAssignmentError
    }

    return data.id
  }

  async function findReusableVehicle(vehicle: any) {
    const ownedCompanyIds = authStore.companyMemberships
      .filter((membership) => membership.role === 'owner')
      .map((membership) => membership.company_id)

    if (ownedCompanyIds.length === 0) {
      return null
    }

    let query = supabase
      .from('vehicles')
      .select('id, company_id, vin, plate, unit, make, model, year')
      .in('company_id', ownedCompanyIds)
      .limit(1)

    if (vehicle.vin) {
      query = query.eq('vin', vehicle.vin)
    } else {
      query = query
        .eq('plate', vehicle.plate)
        .eq('unit', vehicle.unit)
        .eq('make', vehicle.make)
        .eq('model', vehicle.model)
    }

    const { data, error: reusableVehicleError } = await query.maybeSingle()

    if (reusableVehicleError) {
      throw reusableVehicleError
    }

    return data || null
  }

  async function fetchOwnedFleetVehicles() {
    if (!authStore.companyId) {
      return []
    }

    const ownedCompanyIds = authStore.companyMemberships
      .filter((membership) => membership.role === 'owner')
      .map((membership) => membership.company_id)

    if (ownedCompanyIds.length === 0) {
      return []
    }

    const { data: assignedToCurrentBusiness, error: assignedVehiclesError } = await supabase
      .from('vehicle_company_assignments')
      .select('vehicle_id')
      .eq('company_id', authStore.companyId)

    if (assignedVehiclesError) {
      throw assignedVehiclesError
    }

    const assignedVehicleIds = new Set((assignedToCurrentBusiness || []).map((assignment) => assignment.vehicle_id))

    const { data: ownedVehicles, error: ownedVehiclesError } = await supabase
      .from('vehicles')
      .select('id, company_id, unit, type, make, model, year, plate, vin, odometer, engine_hours, status, photo_url, created_at')
      .in('company_id', ownedCompanyIds)
      .order('created_at', { ascending: false })

    if (ownedVehiclesError) {
      throw ownedVehiclesError
    }

    return (ownedVehicles || []).filter((vehicle) => !assignedVehicleIds.has(vehicle.id))
  }

  async function assignExistingVehicleToBusiness(vehicleId: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Select an active business before assigning a vehicle.'
      loading.value = false
      return false
    }

    try {
      await createVehicleAssignment(vehicleId, authStore.companyId)
      await fetchVehicles()
      loading.value = false
      return true
    } catch (supabaseError: any) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }
  }

  async function fetchVehicles() {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      vehicles.value = []
      summaryVehicles.value = []
      total.value = 0
      loading.value = false
      return
    }

    try {
      await ensureLegacyAssignments(authStore.companyId)
      const assignments = await fetchVehicleAssignments(authStore.companyId)
      const vehicleIds = assignments.map((assignment) => assignment.vehicle_id)
      const vehicleRecords = await fetchVehiclesByIds(vehicleIds)
      const mergedVehicles = mergeAssignmentsWithVehicles(assignments, vehicleRecords)
      const searchValue = search.value.trim().toLowerCase()

      const searchMatchedVehicles = mergedVehicles.filter((vehicle: any) => {
        if (!searchValue) {
          return true
        }

        const haystack = [vehicle.unit, vehicle.make, vehicle.model, vehicle.plate, vehicle.type, vehicle.vin]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(searchValue)
      })

      summaryVehicles.value = searchMatchedVehicles

      const filteredVehicles = searchMatchedVehicles.filter((vehicle: any) => {
        return statusFilter.value === 'all' || vehicle.status === statusFilter.value
      })

      total.value = filteredVehicles.length

      const from = (page.value - 1) * pageSize.value
      const to = from + pageSize.value
      vehicles.value = filteredVehicles.slice(from, to)
    } catch (supabaseError: any) {
      error.value = supabaseError.message
      vehicles.value = []
      summaryVehicles.value = []
      total.value = 0
    }

    loading.value = false
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
      error.value = 'Select an active business before adding a vehicle.'
      loading.value = false
      return false
    }

    const payload = {
      ...vehicle,
      company_id: authStore.companyId,
    }

    try {
      const reusableVehicle = await findReusableVehicle(vehicle)

      if (reusableVehicle?.id) {
        await createVehicleAssignment(reusableVehicle.id, authStore.companyId)
      } else {
        const { data, error: supabaseError } = await supabase
          .from('vehicles')
          .insert(payload)
          .select('id')
          .single()

        if (supabaseError) {
          throw supabaseError
        }

        await createVehicleAssignment(data.id, authStore.companyId)
      }
    } catch (supabaseError: any) {
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

    const payload = Object.fromEntries(
      Object.entries(vehicle).filter(([key, value]) => mutableVehicleFields.includes(key as typeof mutableVehicleFields[number]) && value !== undefined)
    )

    if (Object.keys(payload).length === 0) {
      loading.value = false
      return true
    }

    const { error: supabaseError } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)

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

  async function deleteVehicle(id: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Select an active business before deleting a vehicle.'
      loading.value = false
      return false
    }

    const { data: assignments, error: assignmentLookupError } = await supabase
      .from('vehicle_company_assignments')
      .select('id, company_id')
      .eq('vehicle_id', id)

    if (assignmentLookupError) {
      error.value = assignmentLookupError.message
      loading.value = false
      return false
    }

    const currentAssignment = (assignments || []).find((assignment) => assignment.company_id === authStore.companyId)

    if (!currentAssignment) {
      error.value = 'This vehicle is not assigned to the active business.'
      loading.value = false
      return false
    }

    const { error: deleteAssignmentError } = await supabase
      .from('vehicle_company_assignments')
      .delete()
      .eq('id', currentAssignment.id)

    if (deleteAssignmentError) {
      error.value = deleteAssignmentError.message
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

    if (!authStore.companyId) {
      selectedVehicle.value = null
      loading.value = false
      return
    }

    await ensureLegacyAssignments(authStore.companyId)

    const { data: assignment, error: assignmentError } = await supabase
      .from('vehicle_company_assignments')
      .select('vehicle_id, status, assigned_driver_id, service_type, started_at, ended_at, notes')
      .eq('company_id', authStore.companyId)
      .eq('vehicle_id', id)
      .maybeSingle()

    if (assignmentError) {
      error.value = assignmentError.message
      selectedVehicle.value = null
      loading.value = false
      return
    }

    if (!assignment) {
      error.value = 'Vehicle is not assigned to the active business.'
      selectedVehicle.value = null
      loading.value = false
      return
    }

    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (supabaseError) {
      error.value = supabaseError.message
      selectedVehicle.value = null
    } else {
      selectedVehicle.value = {
        ...data,
        availability_status: assignment.status || data.availability_status || 'available',
        active_service_type: assignment.service_type || data.active_service_type || null,
        current_assignment_started_at: assignment.started_at || null,
        current_assignment_ended_at: assignment.ended_at || null,
        current_assignment_notes: assignment.notes || null,
      }
    }

    loading.value = false
  }

  function resetFilters() {
    search.value = ''
    statusFilter.value = 'all'
    page.value = 1
  }

  watch(
    () => authStore.companyId,
    async () => {
      selectedVehicle.value = null
      page.value = 1
      await fetchVehicles()
    }
  )

  return {
    vehicles,
    summaryVehicles,
    selectedVehicle,

    loading,
    error,

    page,
    pageSize,
    total,
    totalPages,

    search,
    statusFilter,

    fetchVehicles,
    fetchVehicleById,
    fetchOwnedFleetVehicles,

    createVehicle,
    assignExistingVehicleToBusiness,
    updateVehicle,
    deleteVehicle,

    setSearch,
    setStatusFilter,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    resetFilters,
  }
})