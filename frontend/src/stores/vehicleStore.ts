import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export const useVehicleStore = defineStore('vehicles', () => {
  const authStore = useAuthStore()
  const vehicles = ref<any[]>([])
  const vehicleTypes = ref<any[]>([])
  const selectedVehicle = ref<any | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)

  const search = ref('')
  const statusFilter = ref('all')

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(total.value / pageSize.value))
  })

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
    engine_hours,
    status,
    photo_url,
    vehicle_type_id,
    vehicle_types (
      id,
      name
    )
  `

  async function fetchVehicles() {
    loading.value = true
    error.value = null

    const from = (page.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
      
    if (!authStore.companyId) {
        vehicles.value = []
        total.value = 0
        loading.value = false
        return
    }

    let query = supabase
      .from('vehicles')
      .select(vehicleSelect, { count: 'exact' })
      .eq('company_id', authStore.companyId)
      .order('created_at', { ascending: false })

    if (statusFilter.value !== 'all') {
      query = query.eq('status', statusFilter.value)
    }

    const searchValue = search.value.trim()

    if (searchValue) {
      const matchingTypeIds = await findVehicleTypeIds(searchValue)
      const filters = [
        `unit.ilike.%${searchValue}%`,
        `make.ilike.%${searchValue}%`,
        `model.ilike.%${searchValue}%`,
        `plate.ilike.%${searchValue}%`,
      ]

      if (matchingTypeIds.length) {
        filters.push(`vehicle_type_id.in.(${matchingTypeIds.join(',')})`)
      }

      query = query.or(filters.join(','))
    }

    const { data, count, error: supabaseError } = await query.range(from, to)

    if (supabaseError) {
      error.value = supabaseError.message
      vehicles.value = []
      total.value = 0
    } else {
      vehicles.value = data || []
      total.value = count || 0
    }

    loading.value = false
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
  
    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .insert({
        ...vehicle,
        company_id: authStore.companyId,
      })
      .select(vehicleSelect)
  
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

    const { error: supabaseError } = await supabase
      .from('vehicles')
      .update(vehicle)
      .eq('id', id)
      .eq('company_id', authStore.companyId)

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

    const { data, error: supabaseError } = await supabase
      .from('vehicles')
      .select(vehicleSelect)
      .eq('id', id)
      .eq('company_id', authStore.companyId)
      .single()

    if (supabaseError) {
      error.value = supabaseError.message
      selectedVehicle.value = null
    } else {
      selectedVehicle.value = data
    }

    loading.value = false
  }

  function resetFilters() {
    search.value = ''
    statusFilter.value = 'all'
    page.value = 1
  }

  return {
    vehicles,
    vehicleTypes,
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
    fetchVehicleTypes,
    fetchVehicleById,

    createVehicle,
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
