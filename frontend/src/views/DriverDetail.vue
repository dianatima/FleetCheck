<template>
  <AppLayout :title="driver?.name || store.t('driverProfile')">
    <RouterLink to="/drivers" class="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
      <ArrowLeft :size="16" /> {{ store.t('backToDrivers') }}
    </RouterLink>

    <div v-if="message" class="mb-5 rounded-2xl bg-green-50 px-5 py-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
      {{ message }}
    </div>

    <div v-if="localError" class="mb-5 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {{ localError }}
    </div>

    <div v-if="loading" class="space-y-5 animate-pulse">
      <div class="card h-40" />
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="card h-64" />
        <div class="card h-64" />
      </div>
    </div>

    <div v-else-if="driver" class="space-y-5">
      <div class="card p-5">
        <div class="flex flex-wrap items-start gap-4">
          <img
            v-if="driver.avatarUrl"
            :src="driver.avatarUrl"
            :alt="driver.name"
            class="h-20 w-20 rounded-2xl border border-gray-200 object-cover dark:border-gray-700"
            referrerpolicy="no-referrer"
          />
          <div v-else class="flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-bold text-white" :style="{ background: driver.avatarColor }">
            {{ initials(driver.name) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ driver.name }}</h2>
              <span :class="statusBadge(driver.status)">{{ statusLabel(driver.status) }}</span>
              <span :class="availabilityBadge(driver)">{{ availabilityLabel(driver) }}</span>
            </div>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ driver.email || '—' }}</p>
            <p v-if="authStore.currentCompany" class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ store.t('activeBusiness') }}: {{ authStore.currentCompany.company_name }}
            </p>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ availabilityHint(driver) }}</p>
          </div>

          <div v-if="driver.status === 'pending'" class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary px-4 py-2 text-sm" @click="updateDriverStatus('active')">
              {{ store.t('approveDriver') }}
            </button>
            <button type="button" class="btn-secondary px-4 py-2 text-sm text-red-600 dark:text-red-300" @click="updateDriverStatus('inactive')">
              {{ store.t('rejectDriver') }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,2fr),360px]">
        <div class="space-y-5">
          <section class="card p-5 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ store.t('personalInformation') }}</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <DetailRow :icon="Mail" :label="store.t('emailField')" :value="driver.email || '—'" />
              <DetailRow :icon="Phone" :label="store.t('phone')" :value="driver.phone || '—'" />
              <DetailRow :icon="Cake" :label="store.t('dateOfBirth')" :value="driver.birthday ? formatDate(driver.birthday) : '—'" />
              <DetailRow :icon="CalendarDays" :label="store.t('hireDate')" :value="driver.hireDate ? formatDate(driver.hireDate) : '—'" />
            </div>
            <DetailRow :icon="MapPin" :label="store.t('address')" :value="driver.address || '—'" />
          </section>

          <section class="rounded-2xl border border-red-200 bg-red-50/40 p-5 dark:border-red-800 dark:bg-red-900/10">
            <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-red-500">{{ store.t('emergencyContact') }}</h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <DetailRow :icon="User" :label="store.t('contactName')" :value="driver.emergencyName || '—'" />
              <DetailRow :icon="Phone" :label="store.t('contactPhone')" :value="driver.emergencyPhone || '—'" />
            </div>
          </section>
        </div>

        <div class="space-y-5">
          <section class="card p-5 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ store.t('driverLicense') }}</h3>
            <DetailRow :icon="Hash" :label="store.t('licenseNumber')" :value="driver.licenseNo || '—'" mono />
            <DetailRow :icon="Award" :label="store.t('licenseClass')" :value="driver.licenseClass || '—'" />
            <DetailRow :icon="CalendarDays" :label="store.t('expiryDate')" :value="driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '—'" :value-class="isExpired(driver.licenseExpiry) ? 'text-red-600 dark:text-red-400' : ''" />
            <a v-if="driver.licensePhotoUrl" :href="driver.licensePhotoUrl" target="_blank" rel="noreferrer" class="inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{{ store.t('view') }}</a>
          </section>

          <section class="card p-5 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ store.t('medicalCard') }}</h3>
            <DetailRow :icon="Hash" :label="store.t('medicalCardNumber')" :value="driver.medCardNo || '—'" mono />
            <DetailRow :icon="CalendarDays" :label="store.t('expiryDate')" :value="driver.medCardExpiry ? formatDate(driver.medCardExpiry) : '—'" :value-class="isExpired(driver.medCardExpiry) ? 'text-red-600 dark:text-red-400' : ''" />
            <a v-if="driver.medCardPhotoUrl" :href="driver.medCardPhotoUrl" target="_blank" rel="noreferrer" class="inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">{{ store.t('view') }}</a>
          </section>

          <section class="card p-5 space-y-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{{ store.t('status') }}</h3>
            <div class="grid gap-3">
              <DetailRow :icon="Briefcase" :label="store.t('availabilityBusiness')" :value="driver.activeCompanyName || authStore.currentCompany?.company_name || '—'" />
              <DetailRow :icon="Truck" :label="store.t('vehicle')" :value="driver.activeVehicleName || '—'" />
              <DetailRow :icon="ClipboardCheck" :label="store.t('type')" :value="driver.activeServiceType || '—'" />
            </div>
          </section>
        </div>
      </div>
    </div>

    <div v-else class="card p-6 text-sm text-gray-500 dark:text-gray-400">
      {{ store.t('noDriversFound') }}
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Award, Briefcase, Cake, CalendarDays, ClipboardCheck, Hash, Mail, MapPin, Phone, Truck, User } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '@/lib/supabase'

type DriverDetailRecord = {
  id: string
  authUserId: string | null
  name: string
  email: string
  phone: string
  birthday: string
  address: string
  emergencyName: string
  emergencyPhone: string
  licenseNo: string
  licenseClass: string
  licenseExpiry: string
  licensePhotoUrl: string
  medCardNo: string
  medCardExpiry: string
  medCardPhotoUrl: string
  hireDate: string
  status: string
  avatarUrl: string
  avatarColor: string
  availabilityStatus: 'available' | 'busy' | 'maintenance'
  activeCompanyName: string
  activeVehicleName: string
  activeServiceType: string
}

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()

const loading = ref(true)
const localError = ref('')
const message = ref('')
const driver = ref<DriverDetailRecord | null>(null)

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
const TODAY = new Date().toISOString().split('T')[0]

const DetailRow = defineComponent({
  props: {
    icon: { type: Object, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    mono: { type: Boolean, default: false },
    valueClass: { type: String, default: '' },
  },
  setup(props) {
    return () => h('div', { class: 'flex items-start gap-3' }, [
      h('div', { class: 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700' }, [
        h(props.icon as any, { size: 15, class: 'text-gray-500 dark:text-gray-400' }),
      ]),
      h('div', [
        h('p', { class: 'text-xs text-gray-500 dark:text-gray-400' }, props.label),
        h('p', { class: `mt-0.5 text-sm font-semibold text-gray-900 dark:text-white${props.mono ? ' font-mono' : ''}${props.valueClass ? ` ${props.valueClass}` : ''}` }, props.value),
      ]),
    ])
  },
})

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'DR'
}

function formatDate(value: string) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function isExpired(value: string) {
  return Boolean(value) && value < TODAY
}

function avatarColorFor(seed: string) {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarColors[total % avatarColors.length]
}

function statusLabel(status: string) {
  if (status === 'pending') return store.t('statusPending')
  if (status === 'inactive') return store.t('statusInactive')
  return store.t('statusActive')
}

function statusBadge(status: string) {
  if (status === 'pending') return 'inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  if (status === 'inactive') return 'inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  return 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300'
}

function isBusy(record: DriverDetailRecord) {
  return record.availabilityStatus === 'busy' || Boolean(record.activeCompanyName || record.activeVehicleName || record.activeServiceType)
}

function availabilityLabel(record: DriverDetailRecord) {
  if (record.availabilityStatus === 'maintenance') {
    return store.t('statusInRepair')
  }

  return isBusy(record) ? store.t('availabilityBusy') : store.t('availabilityAvailable')
}

function availabilityBadge(record: DriverDetailRecord) {
  if (record.availabilityStatus === 'maintenance') {
    return 'inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  return isBusy(record)
    ? 'inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    : 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300'
}

function availabilityHint(record: DriverDetailRecord) {
  if (!isBusy(record)) {
    return store.t('availabilityReadyHint')
  }

  const segments = []

  if (record.activeCompanyName) {
    segments.push(`${store.t('availabilityBusiness')}: ${record.activeCompanyName}`)
  }

  if (record.activeVehicleName) {
    segments.push(`${store.t('availabilityVehicle')}: ${record.activeVehicleName}`)
  }

  if (record.activeServiceType) {
    segments.push(`${store.t('availabilityService')}: ${record.activeServiceType}`)
  }

  return segments.join(' · ') || store.t('availabilityAssignedElsewhere')
}

async function loadDriver() {
  loading.value = true
  localError.value = ''

  if (!authStore.companyId || !route.params.id) {
    driver.value = null
    loading.value = false
    return
  }

  const { data: driverData, error: driverError } = await supabase
    .from('drivers')
    .select('id, auth_user_id, first_name, last_name, email, phone, birthday, address, emergency_name, emergency_phone, license_no, license_class, license_expiry, license_photo_url, med_card_no, med_card_expiry, med_card_photo_url, hire_date, status, availability_status, active_company_name, active_vehicle_name, active_service_type')
    .eq('id', route.params.id)
    .maybeSingle()

  if (driverError || !driverData) {
    localError.value = driverError?.message || store.t('driverProfileNotFound')
    driver.value = null
    loading.value = false
    return
  }

  if (driverData.auth_user_id) {
    const { count, error: membershipError } = await supabase
      .from('company_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', driverData.auth_user_id)
      .eq('company_id', authStore.companyId)
      .eq('role', 'driver')

    if (membershipError || !count) {
      localError.value = membershipError?.message || store.t('driverProfileNotFound')
      driver.value = null
      loading.value = false
      return
    }
  }

  let avatarUrl = ''

  if (driverData.auth_user_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url, status')
      .eq('auth_user_id', driverData.auth_user_id)
      .maybeSingle()

    avatarUrl = profileData?.avatar_url || ''

    if (profileData?.status && profileData.status !== driverData.status) {
      driverData.status = profileData.status
    }
  }

  const name = [driverData.first_name, driverData.last_name].filter(Boolean).join(' ').trim() || driverData.email || 'Driver'

  driver.value = {
    id: driverData.id,
    authUserId: driverData.auth_user_id || null,
    name,
    email: driverData.email || '',
    phone: driverData.phone || '',
    birthday: driverData.birthday || '',
    address: driverData.address || '',
    emergencyName: driverData.emergency_name || '',
    emergencyPhone: driverData.emergency_phone || '',
    licenseNo: driverData.license_no || '',
    licenseClass: driverData.license_class || '',
    licenseExpiry: driverData.license_expiry || '',
    licensePhotoUrl: driverData.license_photo_url || '',
    medCardNo: driverData.med_card_no || '',
    medCardExpiry: driverData.med_card_expiry || '',
    medCardPhotoUrl: driverData.med_card_photo_url || '',
    hireDate: driverData.hire_date || '',
    status: driverData.status || 'pending',
    avatarUrl,
    avatarColor: avatarColorFor(driverData.email || driverData.id),
    availabilityStatus: driverData.availability_status || 'available',
    activeCompanyName: driverData.active_company_name || '',
    activeVehicleName: driverData.active_vehicle_name || '',
    activeServiceType: driverData.active_service_type || '',
  }

  loading.value = false
}

async function updateDriverStatus(nextStatus: 'active' | 'inactive') {
  if (!driver.value) {
    return
  }

  const { error: driverError } = await supabase
    .from('drivers')
    .update({ status: nextStatus })
    .eq('id', driver.value.id)

  if (driverError) {
    localError.value = driverError.message
    return
  }

  if (driver.value.authUserId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('auth_user_id', driver.value.authUserId)

    if (profileError) {
      localError.value = profileError.message
      return
    }
  }

  message.value = nextStatus === 'active' ? store.t('driverApproved') : store.t('driverRejected')
  await loadDriver()
}

onMounted(loadDriver)

watch(
  () => [route.params.id, authStore.companyId],
  () => {
    message.value = ''
    loadDriver()
  },
)
</script>
