import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabase'

type UserRole = 'owner' | 'driver'

type CompanyMembership = {
  company_id: string
  company_name: string
  driver_invite_code?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  industry?: string | null
  status?: string | null
  role: UserRole | string
  is_default?: boolean
}

type DriverInvite = {
  id: string
  company_id: string
  company_name: string
  code: string
  email: string | null
  status: string
  expires_at: string | null
  created_at: string
}

const ACTIVE_COMPANY_STORAGE_KEY = 'fleetcheck.activeCompanyId'

function getMultiCompanySchemaErrorMessage(message?: string | null) {
  if (!message) {
    return null
  }

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('company_memberships') && normalizedMessage.includes('does not exist')) {
    return 'Multi-company schema is not enabled yet. Run docs/multi-company-schema.sql in Supabase, then try creating the company again.'
  }

  if (normalizedMessage.includes('company_invites') && normalizedMessage.includes('does not exist')) {
    return 'Driver invitations are not enabled yet. Run docs/multi-company-schema.sql in Supabase, then try inviting the driver again.'
  }

  if (normalizedMessage.includes('driver_invite_code')) {
    return 'Driver invite codes are not enabled yet. Run docs/multi-company-schema.sql in Supabase, then try again.'
  }

  return null
}

function getFriendlyAuthErrorMessage(message?: string | null) {
  if (!message) {
    return null
  }

  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. If this account was created with Google, sign in with Google. If you do not have an account yet, create a workspace with email and password first.'
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Open the confirmation email, then try signing in again.'
  }

  if (normalizedMessage.includes('email rate limit exceeded') || normalizedMessage.includes('over_email_send_rate_limit')) {
    return 'Too many email attempts were sent in a short time. Wait a few minutes before trying again, or use an existing signed-in account to join the business.'
  }

  return message
}

function getTranslatedMessage(key: string) {
  try {
    const language = typeof window !== 'undefined' ? window.localStorage.getItem('fleetcheck.language') || 'en' : 'en'
    const translations: Record<string, Record<string, string>> = {
      en: {
        joinBusinessDriverOnly: 'You must be signed in as a driver to join another business.',
        differentOwnerAccountError: 'This driver account is already linked to a different business owner.',
        driverProfileNotFound: 'Driver profile not found.',
        existingDriverAccountSignIn: 'This email already has a driver account. Sign in first, then join the business with the code.',
      },
      uk: {
        joinBusinessDriverOnly: 'Щоб приєднатися до іншого бізнесу, потрібно увійти як водій.',
        differentOwnerAccountError: 'Цей акаунт водія вже прив’язаний до іншого власника бізнесу.',
        driverProfileNotFound: 'Профіль водія не знайдено.',
        existingDriverAccountSignIn: 'Для цієї електронної пошти вже існує акаунт водія. Спочатку увійдіть, а потім приєднайтесь до бізнесу за кодом.',
      },
      es: {
        joinBusinessDriverOnly: 'Debe iniciar sesión como conductor para unirse a otro negocio.',
        differentOwnerAccountError: 'Esta cuenta de conductor ya está vinculada a otro propietario.',
        driverProfileNotFound: 'Perfil del conductor no encontrado.',
        existingDriverAccountSignIn: 'Este correo ya tiene una cuenta de conductor. Inicie sesión primero y luego únase al negocio con el código.',
      },
      fr: {
        joinBusinessDriverOnly: 'Vous devez être connecté en tant que conducteur pour rejoindre une autre entreprise.',
        differentOwnerAccountError: "Ce compte conducteur est déjà lié à un autre propriétaire d'entreprise.",
        driverProfileNotFound: 'Profil du conducteur introuvable.',
        existingDriverAccountSignIn: 'Cette adresse e-mail possède déjà un compte conducteur. Connectez-vous d’abord, puis rejoignez l’entreprise avec le code.',
      },
    }

    return translations[language]?.[key] || translations.en[key] || key
  } catch {
    return key
  }
}

function readStoredActiveCompanyId() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY)
}

function persistActiveCompanyId(companyId: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (companyId) {
    window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, companyId)
    return
  }

  window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY)
}

function getUserProfileSeed(user: any) {
  const metadata = user?.user_metadata || {}
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : ''
  const [firstName = '', ...lastNameParts] = fullName ? fullName.split(/\s+/) : []

  return {
    auth_user_id: user.id,
    email: user.email || null,
    first_name: metadata.first_name || firstName || null,
    last_name: metadata.last_name || lastNameParts.join(' ') || null,
    phone: metadata.phone || null,
    signature_url: null,
    role: 'owner',
    status: 'active',
    company_id: null,
  }
}

function generateInviteCode() {
  return `DRV-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function isExistingUserSignUpResponse(user: any) {
  return Array.isArray(user?.identities) && user.identities.length === 0
}

function buildCompanyInvite(company: CompanyMembership | null): DriverInvite[] {
  if (!company?.driver_invite_code) {
    return []
  }

  return [{
    id: company.company_id,
    company_id: company.company_id,
    company_name: company.company_name,
    code: company.driver_invite_code,
    email: null,
    status: 'active',
    expires_at: null,
    created_at: new Date().toISOString(),
  }]
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<any | null>(null)
  const user = ref<any | null>(null)
  const profile = ref<any | null>(null)
  const companyMemberships = ref<CompanyMembership[]>([])
  const driverInvites = ref<DriverInvite[]>([])
  const activeCompanyId = ref<string | null>(readStoredActiveCompanyId())

  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!session.value?.user)
  const role = computed<UserRole | null>(() => profile.value?.role || null)
  const companyId = computed<string | null>(() => {
    return activeCompanyId.value || companyMemberships.value[0]?.company_id || profile.value?.company_id || null
  })
  const currentCompany = computed<CompanyMembership | null>(() => {
    if (!companyId.value) {
      return null
    }

    return companyMemberships.value.find((membership) => membership.company_id === companyId.value) || null
  })
  const hasMultipleCompanies = computed(() => companyMemberships.value.length > 1)

  const redirectPath = computed(() => {
    if (profile.value?.role === 'driver' && profile.value?.status === 'pending') return '/pending'
    if (role.value === 'driver') return '/driver'
    if (role.value === 'owner') return '/dashboard'
    return '/login'
  })

  function syncActiveCompany(preferredCompanyId?: string | null) {
    const availableCompanyIds = new Set(companyMemberships.value.map((membership) => membership.company_id))
    const storedCompanyId = preferredCompanyId || activeCompanyId.value || readStoredActiveCompanyId()

    if (storedCompanyId && availableCompanyIds.has(storedCompanyId)) {
      activeCompanyId.value = storedCompanyId
      persistActiveCompanyId(activeCompanyId.value)
      return
    }

    activeCompanyId.value = companyMemberships.value.find((membership) => membership.is_default)?.company_id
      || companyMemberships.value[0]?.company_id
      || profile.value?.company_id
      || null

    persistActiveCompanyId(activeCompanyId.value)
  }

  async function fetchFallbackCompanyMemberships(): Promise<CompanyMembership[]> {
    if (!profile.value?.company_id) {
      return []
    }

    const fallbackMembership: CompanyMembership = {
      company_id: profile.value.company_id,
      company_name: 'Company',
      driver_invite_code: null,
      industry: null,
      status: null,
      role: profile.value?.role || 'owner',
      is_default: true,
    }

    const { data, error: companyError } = await supabase
      .from('companies')
      .select('id, name, industry, status, driver_invite_code')
      .eq('id', profile.value.company_id)
      .single()

    if (companyError || !data) {
      return [fallbackMembership]
    }

    return [{
      company_id: data.id,
      company_name: data.name,
      driver_invite_code: data.driver_invite_code || null,
      industry: data.industry || null,
      status: data.status || null,
      role: profile.value?.role || 'owner',
      is_default: true,
    }]
  }

  async function fetchCompanyMemberships() {
    if (!user.value?.id) {
      companyMemberships.value = []
      activeCompanyId.value = null
      persistActiveCompanyId(null)
      return []
    }

    const { data, error: membershipsError } = await supabase
      .from('company_memberships')
      .select('company_id, role, is_default, companies(id, name, driver_invite_code, country, state, city, address, phone, industry, status)')
      .eq('user_id', user.value.id)

    const schemaErrorMessage = getMultiCompanySchemaErrorMessage(membershipsError?.message)

    const dedupeMemberships = (memberships: CompanyMembership[]) => {
      const membershipMap = new Map<string, CompanyMembership>()

      for (const membership of memberships) {
        if (!membership.company_id) {
          continue
        }

        const current = membershipMap.get(membership.company_id)

        if (!current || (!current.is_default && membership.is_default)) {
          membershipMap.set(membership.company_id, membership)
        }
      }

      return [...membershipMap.values()]
    }

    if (!membershipsError && Array.isArray(data) && data.length > 0) {
      const normalizedMemberships = data
        .map((membership: any) => {
          const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies

          if (!membership.company_id || !company?.name) {
            return null
          }

          return {
            company_id: membership.company_id,
            company_name: company.name,
            driver_invite_code: company.driver_invite_code || null,
            country: company.country || null,
            state: company.state || null,
            city: company.city || null,
            address: company.address || null,
            phone: company.phone || null,
            industry: company.industry || null,
            status: company.status || null,
            role: membership.role,
            is_default: Boolean(membership.is_default),
          } satisfies CompanyMembership
        })
        .filter(Boolean) as CompanyMembership[]

      companyMemberships.value = dedupeMemberships(normalizedMemberships)
    } else {
      companyMemberships.value = dedupeMemberships(await fetchFallbackCompanyMemberships())

      if (schemaErrorMessage) {
        console.warn(schemaErrorMessage)
      }
    }

    syncActiveCompany()
    return companyMemberships.value
  }

  function setActiveCompany(nextCompanyId: string) {
    if (!companyMemberships.value.some((membership) => membership.company_id === nextCompanyId)) {
      return false
    }

    activeCompanyId.value = nextCompanyId
    persistActiveCompanyId(nextCompanyId)
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
    if (!user.value?.id) {
      error.value = 'You must be signed in to create a company.'
      return false
    }

    loading.value = true
    error.value = null

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: payload.name,
        driver_invite_code: generateInviteCode(),
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

    const { error: membershipError } = await supabase.from('company_memberships').insert({
      user_id: user.value.id,
      company_id: companyData.id,
      role: 'owner',
      is_default: companyMemberships.value.length === 0,
    })

    if (membershipError) {
      await supabase.from('companies').delete().eq('id', companyData.id)
      error.value = getMultiCompanySchemaErrorMessage(membershipError.message) || membershipError.message
      loading.value = false
      return false
    }

    await fetchCompanyMemberships()
    setActiveCompany(companyData.id)
    loading.value = false
    return true
  }

  async function fetchDriverInvites() {
    if (!user.value?.id || !companyId.value) {
      driverInvites.value = []
      return []
    }

    driverInvites.value = buildCompanyInvite(currentCompany.value)

    return driverInvites.value
  }

  async function createDriverInvite() {
    if (!user.value?.id || !companyId.value) {
      error.value = 'You must be signed in to create a driver invite.'
      return null
    }

    loading.value = true
    error.value = null

    const code = generateInviteCode()
    const { error: inviteError } = await supabase
      .from('companies')
      .update({ driver_invite_code: code })
      .eq('id', companyId.value)

    if (inviteError) {
      error.value = getMultiCompanySchemaErrorMessage(inviteError.message) || inviteError.message || 'Unable to create driver invite.'
      loading.value = false
      return null
    }

    companyMemberships.value = companyMemberships.value.map((membership) => {
      if (membership.company_id !== companyId.value) {
        return membership
      }

      return {
        ...membership,
        driver_invite_code: code,
      }
    })

    driverInvites.value = buildCompanyInvite(currentCompany.value)
    loading.value = false

    return {
      id: companyId.value,
      company_id: companyId.value,
      company_name: currentCompany.value?.company_name || 'Company',
      code,
      email: null,
      status: 'active',
      expires_at: null,
      created_at: new Date().toISOString(),
    } satisfies DriverInvite
  }

  async function getDriverInviteByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase()

    if (!normalizedCode) {
      return null
    }

    const { data, error: inviteError } = await supabase
      .from('companies')
      .select('id, name, driver_invite_code, country')
      .eq('driver_invite_code', normalizedCode)
      .maybeSingle()

    if (inviteError) {
      error.value = getMultiCompanySchemaErrorMessage(inviteError.message) || inviteError.message
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      company_id: data.id,
      code: data.driver_invite_code,
      company_name: data.name,
      country: data.country || null,
    }
  }

  async function registerDriverWithInvite(payload: {
    code: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    password: string
    birthday?: string
    hire_date?: string
    address?: string
    emergency_name?: string
    emergency_phone?: string
    license_no: string
    license_class: string
    license_expiry?: string
    med_card_no?: string
    med_card_expiry?: string
    avatar_url?: string | null
    license_photo_url?: string | null
    med_card_photo_url?: string | null
  }) {
    loading.value = true
    error.value = null

    const invite = await getDriverInviteByCode(payload.code)

    if (!invite) {
      error.value = 'Invitation code not found.'
      loading.value = false
      return false
    }

    const { data: ownerMembership, error: ownerMembershipError } = await supabase
      .from('company_memberships')
      .select('user_id')
      .eq('company_id', invite.company_id)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    if (ownerMembershipError || !ownerMembership?.user_id) {
      error.value = getMultiCompanySchemaErrorMessage(ownerMembershipError?.message) || ownerMembershipError?.message || 'Business owner not found for this invite code.'
      loading.value = false
      return false
    }

    const normalizedEmail = payload.email.trim().toLowerCase()
    const canReuseCurrentDriver = user.value?.id
      && profile.value?.role === 'driver'
      && user.value?.email?.trim().toLowerCase() === normalizedEmail

    let accountUser = canReuseCurrentDriver ? user.value : null
    let accountSession = canReuseCurrentDriver ? session.value : null

    if (!accountUser) {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
      })

      if (signUpError || !authData.user) {
        error.value = getFriendlyAuthErrorMessage(signUpError?.message) || 'Driver registration failed.'
        loading.value = false
        return false
      }

      if (isExistingUserSignUpResponse(authData.user)) {
        error.value = getTranslatedMessage('existingDriverAccountSignIn')
        loading.value = false
        return false
      }

      accountUser = authData.user
      accountSession = authData.session
    }

    const { data: existingDriver, error: existingDriverError } = await supabase
      .from('drivers')
      .select('id, owner_user_id, status, license_photo_url, med_card_photo_url')
      .eq('auth_user_id', accountUser.id)
      .maybeSingle()

    if (existingDriverError) {
      error.value = existingDriverError.message
      loading.value = false
      return false
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('auth_user_id', accountUser.id)
      .maybeSingle()

    if (existingProfileError) {
      error.value = existingProfileError.message
      loading.value = false
      return false
    }

    const driverStatus = existingDriver?.status || 'pending'

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        auth_user_id: accountUser.id,
        company_id: invite.company_id,
        role: 'driver',
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email.trim(),
        phone: payload.phone?.trim() || null,
        avatar_url: payload.avatar_url ?? existingProfile?.avatar_url ?? null,
        status: driverStatus,
      }, { onConflict: 'auth_user_id' })

    if (profileError) {
      if (profileError.message?.includes('profiles_auth_user_id_fkey')) {
        error.value = getTranslatedMessage('existingDriverAccountSignIn')
        loading.value = false
        return false
      }

      error.value = profileError.message
      loading.value = false
      return false
    }

    const { error: membershipError } = await supabase
      .from('company_memberships')
      .upsert({
        user_id: accountUser.id,
        company_id: invite.company_id,
        role: 'driver',
        is_default: true,
      }, { onConflict: 'user_id,company_id,role' })

    if (membershipError) {
      error.value = getMultiCompanySchemaErrorMessage(membershipError.message) || membershipError.message
      loading.value = false
      return false
    }

    const driverRecord = {
      auth_user_id: accountUser.id,
      owner_user_id: existingDriver?.owner_user_id || ownerMembership.user_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email.trim(),
      phone: payload.phone?.trim() || null,
      birthday: payload.birthday || null,
      hire_date: payload.hire_date || null,
      address: payload.address?.trim() || null,
      emergency_name: payload.emergency_name?.trim() || null,
      emergency_phone: payload.emergency_phone?.trim() || null,
      license_no: payload.license_no.trim(),
      license_class: payload.license_class.trim(),
      license_expiry: payload.license_expiry || null,
      med_card_no: payload.med_card_no?.trim() || null,
      med_card_expiry: payload.med_card_expiry || null,
      license_photo_url: payload.license_photo_url ?? existingDriver?.license_photo_url ?? null,
      med_card_photo_url: payload.med_card_photo_url ?? existingDriver?.med_card_photo_url ?? null,
      status: driverStatus,
    }

    const { error: driverError } = existingDriver
      ? await supabase
        .from('drivers')
        .update(driverRecord)
        .eq('id', existingDriver.id)
      : await supabase
        .from('drivers')
        .insert(driverRecord)

    if (driverError) {
      error.value = driverError.message
      loading.value = false
      return false
    }

    session.value = accountSession
    user.value = accountUser
    await fetchProfile()
    loading.value = false
    return true
  }

  async function joinDriverCompanyWithCode(code: string) {
    if (!user.value?.id || profile.value?.role !== 'driver') {
      error.value = getTranslatedMessage('joinBusinessDriverOnly')
      return false
    }

    loading.value = true
    error.value = null

    const invite = await getDriverInviteByCode(code)

    if (!invite) {
      error.value = 'Invitation code not found.'
      loading.value = false
      return false
    }

    const { data: existingDriver, error: existingDriverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('auth_user_id', user.value.id)
      .maybeSingle()

    if (existingDriverError || !existingDriver) {
      error.value = existingDriverError?.message || getTranslatedMessage('driverProfileNotFound')
      loading.value = false
      return false
    }

    const { error: membershipError } = await supabase
      .from('company_memberships')
      .upsert({
        user_id: user.value.id,
        company_id: invite.company_id,
        role: 'driver',
        is_default: false,
      }, { onConflict: 'user_id,company_id,role' })

    if (membershipError) {
      error.value = getMultiCompanySchemaErrorMessage(membershipError.message) || membershipError.message
      loading.value = false
      return false
    }

    await fetchCompanyMemberships()
    setActiveCompany(invite.company_id)
    loading.value = false
    return true
  }

  async function deleteCompany(companyToDeleteId: string, password: string) {
    if (!user.value?.id || !user.value?.email) {
      error.value = 'You must be signed in to delete a company.'
      return false
    }

    const membership = companyMemberships.value.find((item) => item.company_id === companyToDeleteId)

    if (!membership) {
      error.value = 'Company membership not found.'
      return false
    }

    if (membership.role !== 'owner') {
      error.value = 'Only an owner can delete a company.'
      return false
    }

    loading.value = true
    error.value = null

    const { data: authData, error: authError } = await supabase.
    auth.signInWithPassword({
      email: user.value.email,
      password,
    })

    if (authError || !authData.user) {
      error.value = authError?.message || 'Password confirmation failed.'
      loading.value = false
      return false
    }

    session.value = authData.session
    user.value = authData.user

    const { count: membershipCount, error: membershipCountError } = await supabase
      .from('company_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyToDeleteId)

    if (membershipCountError) {
      error.value = membershipCountError.message
      loading.value = false
      return false
    }

    if ((membershipCount || 0) <= 1) {
      const { error: archiveError } = await supabase
        .from('companies')
        .update({ status: 'archived' })
        .eq('id', companyToDeleteId)

      if (archiveError) {
        error.value = archiveError.message
        loading.value = false
        return false
      }
    }

    const { error: membershipDeleteError } = await supabase
      .from('company_memberships')
      .delete()
      .eq('user_id', user.value.id)
      .eq('company_id', companyToDeleteId)

    if (membershipDeleteError) {
      error.value = membershipDeleteError.message
      loading.value = false
      return false
    }

    const fallbackCompanyId = companyMemberships.value.find((item) => item.company_id !== companyToDeleteId)?.company_id || null

    if (profile.value?.company_id === companyToDeleteId) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ company_id: fallbackCompanyId })
        .eq('auth_user_id', user.value.id)

      if (profileUpdateError) {
        error.value = profileUpdateError.message
        loading.value = false
        return false
      }

      profile.value = {
        ...profile.value,
        company_id: fallbackCompanyId,
      }
    }

    await fetchCompanyMemberships()
    syncActiveCompany(fallbackCompanyId)
    loading.value = false
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
    } else {
      profile.value = null
      companyMemberships.value = []
      activeCompanyId.value = null
      persistActiveCompanyId(null)
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
      .maybeSingle()

    if (profileError) {
      error.value = profileError.message
      profile.value = null
      return null
    }

    if (!data) {
      const fallbackProfile = getUserProfileSeed(user.value)
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert(fallbackProfile)
        .select('*')
        .maybeSingle()

      if (createProfileError) {
        profile.value = fallbackProfile
        error.value = null
        await fetchCompanyMemberships()
        return profile.value
      }

      profile.value = createdProfile || fallbackProfile
      error.value = null
      await fetchCompanyMemberships()
      return profile.value
    }

    if (data.role === 'driver') {
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id, status, license_expiry, med_card_expiry')
        .eq('auth_user_id', user.value.id)
        .maybeSingle()

      const documentsExpired = Boolean(
        driverData
        && driverData.status !== 'inactive'
        && ((driverData.license_expiry && driverData.license_expiry < new Date().toISOString().split('T')[0])
          || (driverData.med_card_expiry && driverData.med_card_expiry < new Date().toISOString().split('T')[0])),
      )

      if (!driverError && driverData && documentsExpired && data.status !== 'pending') {
        await supabase
          .from('drivers')
          .update({ status: 'pending' })
          .eq('id', driverData.id)

        await supabase
          .from('profiles')
          .update({ status: 'pending' })
          .eq('auth_user_id', user.value.id)

        data.status = 'pending'
      }
    }

    profile.value = data
    error.value = null
    await fetchCompanyMemberships()
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
      error.value = getFriendlyAuthErrorMessage(loginError.message)
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

  async function loginWithGoogle(joinCode?: string | null) {
    loading.value = true
    error.value = null

    const redirectTo = joinCode
      ? `${window.location.origin}/auth/callback?code=${encodeURIComponent(joinCode)}`
      : `${window.location.origin}/auth/callback`

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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
      error.value = getFriendlyAuthErrorMessage(signUpError?.message) || 'Registration failed'
      loading.value = false
      return false
    }

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: payload.company.name,
        driver_invite_code: generateInviteCode(),
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

    const { error: membershipError } = await supabase.from('company_memberships').insert({
      user_id: authData.user.id,
      company_id: companyData.id,
      role: 'owner',
      is_default: true,
    })

    if (membershipError) {
      console.warn(
        getMultiCompanySchemaErrorMessage(membershipError.message)
        || 'Unable to create company membership, using profile fallback instead.',
        membershipError.message
      )
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
    companyMemberships.value = []
    driverInvites.value = []
    activeCompanyId.value = null
    persistActiveCompanyId(null)
  }

  return {
    session,
    user,
    profile,
    companyMemberships,
    driverInvites,
    activeCompanyId,

    loading,
    error,

    isAuthenticated,
    role,
    companyId,
    currentCompany,
    hasMultipleCompanies,
    redirectPath,

    loadSession,
    fetchProfile,
    fetchCompanyMemberships,
    fetchDriverInvites,
    loginWithEmail,
    loginWithGoogle,
    createCompany,
    createDriverInvite,
    getDriverInviteByCode,
    registerDriverWithInvite,
    joinDriverCompanyWithCode,
    deleteCompany,
    registerOwnerWithCompany,
    logout,
    setActiveCompany,
    clearAuthState,
  }
})