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
const STALE_AUTH_KEY_PREFIXES = [
  'sb-',
  'supabase.auth',
  'fleetcheck.auth',
  'fleetcheck.profile',
  'fleetcheck.company',
  'pinia-auth',
]

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

  const passwordSetAt = computed<string | null>(() => {
    if (role.value !== 'driver') return null

    return (
      profile.value?.password_set_at ||
      user.value?.user_metadata?.password_set_at ||
      null
    )
  })

  const redirectPath = computed(() => {
    if (role.value === 'driver') {
      if (!passwordSetAt.value) return '/set-password'
      if (profile.value?.status === 'active') return '/driver'
      if (profile.value?.status === 'inactive') return '/inactive'
      return '/pending'
    }

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

  async function loadSession(options: { validateAccess?: boolean } = {}) {
    const validateAccess = options.validateAccess ?? true

    loading.value = true
    error.value = null

    const { data, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      error.value = sessionError.message
      await forceLogout(sessionError.message)
      loading.value = false
      return false
    }

    if (!data.session) {
      clearAuthState()
      loading.value = false
      return false
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      await forceLogout(userError?.message || 'Session user no longer exists')
      loading.value = false
      return false
    }

    session.value = {
      ...data.session,
      user: userData.user,
    }
    user.value = userData.user

    if (!validateAccess) {
      loading.value = false
      return true
    }

    const currentProfile = await fetchProfile({ validateAccess: true })

    if (!currentProfile) {
      await forceLogout('Your account profile could not be found. Please sign in again.')
      loading.value = false
      return false
    }

    loading.value = false
    return true
  }

  async function ensureAuthenticated() {
    return loadSession({ validateAccess: true })
  }

  async function fetchProfile(options: { validateAccess?: boolean } = {}) {
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
      .maybeSingle()

    if (profileError || !data) {
      error.value = profileError?.message || 'Profile could not be found'
      profile.value = null
      return null
    }

    profile.value = {
      ...data,
      company_name: data.companies?.name || null,
    }

    if (options.validateAccess) {
      const accessReady = await validateProfileAccess()

      if (!accessReady) {
        return null
      }
    } else if (profile.value.role === 'owner') {
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
  
    ownerCompanies.value = (data || [])
      .map((item: any) => {
      const company = Array.isArray(item.companies)
        ? item.companies[0]
        : item.companies

      if (!company) return null
  
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
      .filter(Boolean) as OwnerCompany[]
  
    const activeExists = ownerCompanies.value.some(
      c => c.company_id === activeCompanyId.value
    )
  
    if (activeCompanyId.value && !activeExists) {
      activeCompanyId.value = null
      persistActiveCompany(null)
      return ownerCompanies.value
    }

    if (!activeCompanyId.value) {
      activeCompanyId.value = ownerCompanies.value[0]?.company_id || null
      persistActiveCompany(activeCompanyId.value)
    }
  
    return ownerCompanies.value
  }

  async function validateProfileAccess() {
    if (!profile.value?.id) return false

    if (profile.value.role === 'owner') {
      const companies = await fetchOwnerCompanies()

      if (!companies.length) {
        error.value = 'Company access could not be found'
        return false
      }

      const selectedCompanyId =
        activeCompanyId.value ||
        profile.value.company_id ||
        companies[0]?.company_id ||
        null

      const hasSelectedCompanyAccess = companies.some(
        (company) => company.company_id === selectedCompanyId
      )

      if (!selectedCompanyId || !hasSelectedCompanyAccess) {
        error.value = 'Company access could not be found'
        return false
      }

      activeCompanyId.value = selectedCompanyId
      persistActiveCompany(selectedCompanyId)
      return true
    }

    if (profile.value.role === 'driver') {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id, company_id, user_id')
        .eq('user_id', profile.value.id)
        .maybeSingle()

      if (driverError || !driver?.company_id) {
        error.value = driverError?.message || 'Driver profile could not be found'
        return false
      }

      const { data: driverCompany, error: driverCompanyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', driver.company_id)
        .maybeSingle()

      if (driverCompanyError || !driverCompany) {
        error.value = driverCompanyError?.message || 'Driver company could not be found'
        return false
      }

      if (profile.value.company_id !== driver.company_id) {
        profile.value = {
          ...profile.value,
          company_id: driver.company_id,
        }
      }

      return true
    }

    error.value = 'Unsupported user role'
    return false
  }

  async function ensureCompanyOwner(
    companyId: string | null,
    profileId: string | null,
    options: { reportError?: boolean } = {}
  ) {
    const reportError = options.reportError ?? true

    if (!companyId || !profileId) {
      if (reportError) error.value = 'Company owner relation is missing company or profile id'
      return false
    }

    const { data: existingRelation, error: relationLookupError } = await supabase
      .from('company_owners')
      .select('company_id, profile_id')
      .eq('company_id', companyId)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (relationLookupError) {
      if (reportError) error.value = relationLookupError.message
      return false
    }

    if (existingRelation) return true

    const { error: relationInsertError } = await supabase
      .from('company_owners')
      .insert({
        company_id: companyId,
        profile_id: profileId,
      })

    if (relationInsertError) {
      if (relationInsertError.code === '23505') return true
      if (reportError) error.value = relationInsertError.message
      return false
    }

    return true
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

    const ready = await ensureAuthenticated()
    loading.value = false
    return ready
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

  async function updatePassword(password: string) {
    loading.value = true
    error.value = null

    const nextPasswordSetAt = new Date().toISOString()
    const { data: authData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        password_set_at: nextPasswordSetAt,
      },
    })

    if (updateError || !authData.user) {
      error.value = updateError?.message || 'Password could not be saved'
      loading.value = false
      return false
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({ password_set_at: nextPasswordSetAt })
      .eq('auth_user_id', user.value?.id)
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .single()

    user.value = authData.user
    session.value = session.value
      ? {
          ...session.value,
          user: authData.user,
        }
      : session.value

    if (profileError || !updatedProfile) {
      if (isMissingPasswordSetAtColumn(profileError)) {
        profile.value = profile.value
          ? {
              ...profile.value,
              password_set_at: nextPasswordSetAt,
            }
          : profile.value
        const statusUpdated = await markDriverPasswordCompleted()

        if (!statusUpdated) {
          loading.value = false
          return false
        }

        if (profile.value?.role === 'driver') {
          await fetchProfile()
        }

        error.value = null
        loading.value = false
        return true
      }

      error.value = profileError?.message || 'Password status could not be saved'
      loading.value = false
      return false
    }

    profile.value = {
      ...updatedProfile,
      company_name: updatedProfile.companies?.name || null,
    }

    const statusUpdated = await markDriverPasswordCompleted()

    if (!statusUpdated) {
      loading.value = false
      return false
    }

    if (profile.value?.role === 'driver') {
      await fetchProfile()
    }

    loading.value = false
    return true
  }

  async function markDriverPasswordCompleted() {
    if (role.value !== 'driver') return true

    const token = session.value?.access_token

    if (!token) {
      error.value = 'Access token is missing'
      return false
    }

    const response = await fetch('/api/drivers/password-completed', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      error.value = result?.error || 'Driver account could not be activated'
      return false
    }

    error.value = null
    return true
  }

  function isMissingPasswordSetAtColumn(profileError: any) {
    return (
      profileError?.code === 'PGRST204' ||
      profileError?.message?.includes("password_set_at") ||
      profileError?.message?.includes("schema cache")
    )
  }

  async function acceptDriverInvitation(options: { reportError?: boolean } = {}) {
    const token = session.value?.access_token
    const reportError = options.reportError ?? true

    if (!token) return false

    const response = await fetch('/api/drivers/accept-invite', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      if (reportError) {
        error.value = result?.error || 'Driver invitation could not be accepted'
      }
      return false
    }

    if (result?.accepted) {
      error.value = null
      await fetchProfile()
      return true
    }

    return false
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

    const ownerRelationReady = await ensureCompanyOwner(companyData.id, profileData.id)

    if (!ownerRelationReady) {
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

    const ownerRelationReady = await ensureCompanyOwner(companyData.id, profile.value.id)

    if (!ownerRelationReady) {
      await supabase
        .from('companies')
        .delete()
        .eq('id', companyData.id)
      
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

    const { error: signOutError } = await supabase.auth.signOut()
    clearAuthState()

    if (signOutError) {
      error.value = signOutError.message
    }

    loading.value = false
    return !signOutError
  }

  async function forceLogout(message?: string) {
    await supabase.auth.signOut().catch(() => null)
    clearAuthState()
    if (message) error.value = message
    loading.value = false
    return false
  }

  function clearAuthState() {
    session.value = null
    user.value = null
    profile.value = null
    ownerCompanies.value = []
    activeCompanyId.value = null
    error.value = null
    clearPersistedAuthState()
  }

  function clearPersistedAuthState() {
    removeAuthStorageKeys(localStorage)
    removeAuthStorageKeys(sessionStorage)
  }

  function removeAuthStorageKeys(storage: Storage) {
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index)
    ).filter(Boolean) as string[]

    for (const key of keys) {
      if (
        key === ACTIVE_COMPANY_KEY ||
        STALE_AUTH_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
      ) {
        storage.removeItem(key)
      }
    }
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
    passwordSetAt,
    redirectPath,

    loadSession,
    ensureAuthenticated,
    fetchProfile,
    fetchOwnerCompanies,
    ensureCompanyOwner,

    loginWithEmail,
    loginWithGoogle,
    updatePassword,
    acceptDriverInvitation,
    registerOwnerWithCompany,
    createCompany,

    logout,
    forceLogout,
    setActiveCompany,
    clearAuthState,
  }
})
