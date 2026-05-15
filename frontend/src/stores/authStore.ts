import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'

type UserRole = 'owner' | 'driver'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<any | null>(null)
  const user = ref<any | null>(null)
  const profile = ref<any | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!session.value?.user)
  const role = computed<UserRole | null>(() => profile.value?.role || null)
  const companyId = computed<string | null>(() => profile.value?.company_id || null)

  const redirectPath = computed(() => {
    if (role.value === 'driver') return '/driver'
    if (role.value === 'owner') return '/dashboard'
    return '/login'
  })

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
    } else {
      profile.value = null
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
      .select('*')
      .eq('auth_user_id', user.value.id)
      .single()

    if (profileError) {
      error.value = profileError.message
      profile.value = null
      return null
    }

    profile.value = data

    console.log('USER ID', user.value.id)
    console.log('PROFILE DATA', data)
    console.log('PROFILE ERROR', profileError)
    return data
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

    const { error: profileError } = await supabase.from('profiles').insert({
      auth_user_id: authData.user.id,
      company_id: companyData.id,
      role: 'owner',
      first_name: payload.owner.first_name,
      last_name: payload.owner.last_name,
      email: payload.owner.email,
      phone: payload.owner.phone || null,
      status: 'active',
    })

    if (profileError) {
      error.value = profileError.message
      loading.value = false
      return false
    }

    session.value = authData.session
    user.value = authData.user
    await fetchProfile()

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
  }

  return {
    session,
    user,
    profile,

    loading,
    error,

    isAuthenticated,
    role,
    companyId,
    redirectPath,

    loadSession,
    fetchProfile,
    loginWithEmail,
    loginWithGoogle,
    registerOwnerWithCompany,
    logout,
    clearAuthState,
  }
})