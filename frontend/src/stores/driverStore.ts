import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export const useDriverStore = defineStore('drivers', () => {
  const authStore = useAuthStore()

  const drivers = ref<any[]>([])
  const selectedDriver = ref<any | null>(null)

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

  async function fetchDrivers() {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      drivers.value = []
      total.value = 0
      loading.value = false
      return
    }

    const from = (page.value - 1) * pageSize.value
    const to = from + pageSize.value - 1

    let query = supabase
      .from('drivers')
      .select('*', { count: 'exact' })
      .eq('company_id', authStore.companyId)
      .order('created_at', { ascending: false })

    if (statusFilter.value !== 'all') {
      query = query.eq('status', statusFilter.value)
    }

    const searchValue = search.value.trim()

    if (searchValue) {
      query = query.or(
        `name.ilike.%${searchValue}%,email.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,license_no.ilike.%${searchValue}%,license_class.ilike.%${searchValue}%`
      )
    }

    const { data, count, error: supabaseError } = await query.range(from, to)

    if (supabaseError) {
      error.value = supabaseError.message
      drivers.value = []
      total.value = 0
    } else {
      drivers.value = data || []
      total.value = count || 0
    }

    loading.value = false
  }

  async function fetchDriverById(id: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      selectedDriver.value = null
      loading.value = false
      return
    }

    const { data, error: supabaseError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .eq('company_id', authStore.companyId)
      .single()

    if (supabaseError) {
      error.value = supabaseError.message
      selectedDriver.value = null
    } else {
      selectedDriver.value = data
    }

    loading.value = false
  }

  async function createDriver(driver: any) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Company ID is missing'
      loading.value = false
      return false
    }

    const { error: supabaseError } = await supabase
      .from('drivers')
      .insert({
        ...driver,
        company_id: authStore.companyId,
      })

    if (supabaseError) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }

    await fetchDrivers()
    loading.value = false
    return true
  }

  async function updateDriver(id: string, driver: any) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Company ID is missing'
      loading.value = false
      return false
    }

    const { error: supabaseError } = await supabase
      .from('drivers')
      .update(driver)
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (supabaseError) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }

    await fetchDrivers()

    if (selectedDriver.value?.id === id) {
      await fetchDriverById(id)
    }

    loading.value = false
    return true
  }

  async function deleteDriver(id: string) {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      error.value = 'Company ID is missing'
      loading.value = false
      return false
    }

    const { error: supabaseError } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
      .eq('company_id', authStore.companyId)

    if (supabaseError) {
      error.value = supabaseError.message
      loading.value = false
      return false
    }

    if (selectedDriver.value?.id === id) {
      selectedDriver.value = null
    }

    await fetchDrivers()
    loading.value = false
    return true
  }

  async function setSearch(value: string) {
    search.value = value
    page.value = 1
    await fetchDrivers()
  }

  async function setStatusFilter(value: string) {
    statusFilter.value = value
    page.value = 1
    await fetchDrivers()
  }

  async function setPage(newPage: number) {
    if (newPage < 1 || newPage > totalPages.value) return

    page.value = newPage
    await fetchDrivers()
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
    await fetchDrivers()
  }

  function resetFilters() {
    search.value = ''
    statusFilter.value = 'all'
    page.value = 1
  }

  return {
    drivers,
    selectedDriver,

    loading,
    error,

    page,
    pageSize,
    total,
    totalPages,

    search,
    statusFilter,

    fetchDrivers,
    fetchDriverById,

    createDriver,
    updateDriver,
    deleteDriver,

    setSearch,
    setStatusFilter,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    resetFilters,
  }
})