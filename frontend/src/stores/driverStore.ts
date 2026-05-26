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
  const licenseClassFilter = ref('all')
  const licenseClassOptions = ref<string[]>([])
  const statusCounts = ref<Record<string, number>>({
    new: 0,
    pending: 0,
    active: 0,
    inactive: 0,
  })

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(total.value / pageSize.value))
  })

  async function fetchDrivers() {
    loading.value = true
    error.value = null

    if (!authStore.companyId) {
      drivers.value = []
      total.value = 0
      statusCounts.value = {
        new: 0,
        pending: 0,
        active: 0,
        inactive: 0,
      }
      licenseClassOptions.value = []
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

    if (licenseClassFilter.value !== 'all') {
      query = query.eq('license_class', licenseClassFilter.value)
    }

    const searchValue = search.value.trim()

    if (searchValue) {
      query = query.or(
        driverSearchExpression(searchValue)
      )
    }

    await Promise.all([
      fetchStatusCounts(searchValue),
      fetchLicenseClassOptions(),
    ])

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

  function driverSearchExpression(searchValue: string) {
    return `name.ilike.%${searchValue}%,email.ilike.%${searchValue}%,phone.ilike.%${searchValue}%,license_no.ilike.%${searchValue}%,license_class.ilike.%${searchValue}%`
  }

  async function fetchStatusCounts(searchValue = search.value.trim()) {
    if (!authStore.companyId) {
      statusCounts.value = {
        new: 0,
        pending: 0,
        active: 0,
        inactive: 0,
      }
      return
    }

    const statuses = ['new', 'pending', 'active', 'inactive']
    const counts = { ...statusCounts.value }

    await Promise.all(
      statuses.map(async (status) => {
        let query = supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', authStore.companyId)
          .eq('status', status)

        if (searchValue) {
          query = query.or(driverSearchExpression(searchValue))
        }

        if (licenseClassFilter.value !== 'all') {
          query = query.eq('license_class', licenseClassFilter.value)
        }

        const { count, error: countError } = await query

        if (countError) {
          console.error('[driverStore] failed to count drivers by status', countError)
          counts[status] = 0
        } else {
          counts[status] = count || 0
        }
      })
    )

    statusCounts.value = counts
  }

  async function fetchLicenseClassOptions() {
    if (!authStore.companyId) {
      licenseClassOptions.value = []
      return
    }

    const { data, error: classError } = await supabase
      .from('drivers')
      .select('license_class')
      .eq('company_id', authStore.companyId)
      .not('license_class', 'is', null)

    if (classError) {
      console.error('[driverStore] failed to load license classes', classError)
      licenseClassOptions.value = []
      return
    }

    licenseClassOptions.value = [
      ...new Set((data || []).map((driver) => driver.license_class).filter(Boolean)),
    ].sort((a, b) => String(a).localeCompare(String(b)))
  }

  async function fetchDriverById(id: string, silent = false) {
    if (!silent) loading.value = true
    error.value = null

    if (!authStore.companyId) {
      selectedDriver.value = null
      if (!silent) loading.value = false
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

    if (!silent) loading.value = false
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
        status: 'new',
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

    const driverChanges = { ...driver }
    delete driverChanges.status
    const { error: supabaseError } = await supabase
      .from('drivers')
      .update(driverChanges)
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

  async function sendDriverInvitation(id: string) {
    loading.value = true
    error.value = null

    const token = authStore.session?.access_token

    if (!token) {
      error.value = 'Access token is missing'
      loading.value = false
      return false
    }

    const response = await fetch(`/api/drivers/${id}/invite`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirectTo: `${window.location.origin}/auth/callback`,
      }),
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      error.value = result?.error || 'Invitation could not be sent'
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

  async function updateDriverStatus(
    id: string,
    status: 'active' | 'pending' | 'inactive'
  ) {
    loading.value = true
    error.value = null

    const token = authStore.session?.access_token

    if (!token) {
      error.value = 'Access token is missing'
      loading.value = false
      return false
    }

    const response = await fetch(`/api/drivers/${id}/status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      error.value = result?.error || 'Driver status could not be updated'
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

  async function setLicenseClassFilter(value: string) {
    licenseClassFilter.value = value
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
    licenseClassFilter.value = 'all'
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
    licenseClassFilter,
    licenseClassOptions,
    statusCounts,

    fetchDrivers,
    fetchDriverById,

    createDriver,
    updateDriver,
    sendDriverInvitation,
    updateDriverStatus,
    deleteDriver,

    setSearch,
    setStatusFilter,
    setLicenseClassFilter,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    resetFilters,
  }
})
