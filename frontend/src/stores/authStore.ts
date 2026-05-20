import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'

type UserRole = 'owner' | 'driver'

type OwnerCompany = {
  company_id: string
  company_name: string
  country?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  industry?: string | null
}

const ACTIVE_COMPANY_KEY = 'fleetcheck.activeCompanyId'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<any | null>(null)
  const user = ref<any | null>(null)
  const profile = ref<any | null>(null)

  const ownerCompanies = ref<OwnerCompany[]>([])
  const activeCompanyId = ref<string | null>(
    localStorage.getItem(ACTIVE_COMPANY_KEY)
  )

  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!session.value?.user)
  const role = computed<UserRole | null>(() => profile.value?.role || null)

  const companyId = computed<string | null>(() => {
    if (role.value === 'owner') {
      return activeCompanyId.value || ownerCompanies.value[0]?.company_id || null
    }

    return profile.value?.company_id || null
  })

  const currentCompany = computed(() => {
    if (role.value === 'owner') {
      return ownerCompanies.value.find(c => c.company_id === companyId.value) || null
    }

    return null
  })

  const companyName = computed(() => {
    if (role.value === 'owner') {
      return currentCompany.value?.company_name || null
    }

    return profile.value?.company_name || null
  })

  const hasMultipleCompanies = computed(() => {
    return role.value === 'owner' && ownerCompanies.value.length > 1
  })

  const redirectPath = computed(() => {
    if (role.value === 'driver') return '/driver'
    if (role.value === 'owner') return '/dashboard'
    return '/login'
  })

  function persistActiveCompany(companyId: string | null) {
    if (companyId) {
      localStorage.setItem(ACTIVE_COMPANY_KEY, companyId)
    } else {
      localStorage.removeItem(ACTIVE_COMPANY_KEY)
    }
  }

  function setActiveCompany(companyId: string) {
    const exists = ownerCompanies.value.some(c => c.company_id === companyId)

    if (!exists) return false

    activeCompanyId.value = companyId
    persistActiveCompany(companyId)

    return true
  }

  async function loadSession() {
    loading.value = true
    error.value = null

    const { data, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      error.value = sessionError.message
      clearAuthState()
      loading.value = false
      return false
    }

    session.value = data.session
    user.value = data.session?.user || null

    if (user.value) {
      await fetchProfile()
    }

    loading.value = false
    return true
  }

  async function fetchProfile() {
    if (!user.value?.id) {
      profile.value = null
      return null
    }

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .eq('auth_user_id', user.value.id)
      .single()

    if (profileError) {
      error.value = profileError.message
      profile.value = null
      return null
    }

    profile.value = {
      ...data,
      company_name: data.companies?.name || null,
    }

    if (profile.value.role === 'owner') {
      await fetchOwnerCompanies()
    }

    return profile.value
  }

  async function fetchOwnerCompanies() {
    if (!profile.value?.id || profile.value.role !== 'owner') {
      ownerCompanies.value = []
      return []
    }
  
    const { data, error: companiesError } = await supabase
      .from('company_owners')
      .select(`
        company_id,
        companies (
          id,
          name,
          country,
          state,
          city,
          address,
          phone,
          industry
        )
      `)
      .eq('profile_id', profile.value.id)
  
    if (companiesError) {
      error.value = companiesError.message
      ownerCompanies.value = []
      return []
    }
  
    ownerCompanies.value = (data || []).map((item: any) => {
      const company = Array.isArray(item.companies)
        ? item.companies[0]
        : item.companies
  
      return {
        company_id: item.company_id,
        company_name: company?.name || 'Company',
        country: company?.country || null,
        state: company?.state || null,
        city: company?.city || null,
        address: company?.address || null,
        phone: company?.phone || null,
        industry: company?.industry || null,
      }
    })
  
    const activeExists = ownerCompanies.value.some(
      c => c.company_id === activeCompanyId.value
    )
  
    if (!activeExists) {
      activeCompanyId.value = ownerCompanies.value[0]?.company_id || null
      persistActiveCompany(activeCompanyId.value)
    }
  
    return ownerCompanies.value
  }

  async function loginWithEmail(email: string, password: string) {
    loading.value = true
    error.value = null

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      error.value = loginError.message
      clearAuthState()
      loading.value = false
      return false
    }

    session.value = data.session
    user.value = data.user

    await fetchProfile()

    loading.value = false
    return true
  }

  async function loginWithGoogle() {
    loading.value = true
    error.value = null

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (googleError) {
      error.value = googleError.message
      loading.value = false
      return false
    }

    return true
  }

  async function registerOwnerWithCompany(payload: {
    company: {
      name: string
      country?: string
      state?: string
      city?: string
      address?: string
      phone?: string
      industry?: string
    }
    owner: {
      first_name: string
      last_name: string
      email: string
      phone?: string
      password: string
    }
  }) {
    loading.value = true
    error.value = null

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: payload.owner.email,
      password: payload.owner.password,
    })

    if (signUpError || !authData.user) {
      error.value = signUpError?.message || 'Registration failed'
      loading.value = false
      return false
    }

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: payload.company.name,
        country: payload.company.country || null,
        state: payload.company.state || null,
        city: payload.company.city || null,
        address: payload.company.address || null,
        phone: payload.company.phone || null,
        industry: payload.company.industry || null,
      })
      .select()
      .single()

    if (companyError || !companyData) {
      error.value = companyError?.message || 'Company creation failed'
      loading.value = false
      return false
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        auth_user_id: authData.user.id,
        company_id: companyData.id,
        role: 'owner',
        first_name: payload.owner.first_name,
        last_name: payload.owner.last_name,
        email: payload.owner.email,
        phone: payload.owner.phone || null,
        status: 'active',
      })
      .select()
      .single()

    if (profileError || !profileData) {
      error.value = profileError?.message || 'Profile creation failed'
      loading.value = false
      return false
    }

    const { error: ownerError } = await supabase
      .from('company_owners')
      .insert({
        company_id: companyData.id,
        profile_id: profileData.id,
      })

    if (ownerError) {
      error.value = ownerError.message
      loading.value = false
      return false
    }

    session.value = authData.session
    user.value = authData.user
    profile.value = {
      ...profileData,
      company_name: companyData.name,
    }

    await fetchOwnerCompanies()
    setActiveCompany(companyData.id)

    loading.value = false
    return true
  }

  async function createCompany(payload: {
    name: string
    country?: string
    state?: string
    city?: string
    address?: string
    phone?: string
    industry?: string
  }) {
    if (!profile.value?.id || role.value !== 'owner') {
      error.value = 'Only owner can create company'
      return false
    }

    loading.value = true
    error.value = null

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: payload.name,
        country: payload.country || null,
        state: payload.state || null,
        city: payload.city || null,
        address: payload.address || null,
        phone: payload.phone || null,
        industry: payload.industry || null,
      })
      .select()
      .single()

    if (companyError || !companyData) {
      error.value = companyError?.message || 'Company creation failed'
      loading.value = false
      return false
    }

    const { error: ownerError } = await supabase
      .from('company_owners')
      .insert({
        company_id: companyData.id,
        profile_id: profile.value.id,
      })

    if (ownerError) {
      await supabase
        .from('companies')
        .delete()
        .eq('id', companyData.id)
      
      error.value = ownerError.message
      loading.value = false
      return false
    }

    await fetchOwnerCompanies()
    setActiveCompany(companyData.id)

    loading.value = false
    return true
  }

  async function logout() {
    loading.value = true
    error.value = null

    await supabase.auth.signOut()
    clearAuthState()

    loading.value = false
  }

  function clearAuthState() {
    session.value = null
    user.value = null
    profile.value = null
    ownerCompanies.value = []
    activeCompanyId.value = null
    error.value = null
    localStorage.removeItem(ACTIVE_COMPANY_KEY)
  }

  return {
    session,
    user,
    profile,

    ownerCompanies,
    activeCompanyId,

    loading,
    error,

    isAuthenticated,
    role,
    companyId,
    companyName,
    currentCompany,
    hasMultipleCompanies,
    redirectPath,

    loadSession,
    fetchProfile,
    fetchOwnerCompanies,

    loginWithEmail,
    loginWithGoogle,
    registerOwnerWithCompany,
    createCompany,

    logout,
    setActiveCompany,
    clearAuthState,
  }
})