<template>
  <AppLayout :title="store.t('driverProfile')">
    <div v-if="authStore.profile?.status === 'pending'" class="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
      {{ store.t('pendingMessage') }}
    </div>

    <div v-if="message" class="mb-5 rounded-2xl bg-green-50 px-5 py-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
      {{ message }}
    </div>

    <div v-if="localError" class="mb-5 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {{ localError }}
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,2fr),360px]">
      <div class="space-y-5">
        <div class="card p-5">
          <div class="flex flex-wrap items-start gap-4">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              :alt="displayName"
              class="h-24 w-24 rounded-2xl object-cover border border-gray-200 dark:border-gray-700"
            />
            <div v-else class="h-24 w-24 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 text-2xl font-bold">
              {{ initials(displayName) }}
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ displayName }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
              <p v-if="authStore.currentCompany" class="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{{ authStore.currentCompany.company_name }}</p>
              <span :class="statusBadge" class="mt-2 inline-flex px-2.5 py-1 rounded-full text-xs font-medium">
                {{ statusLabel }}
              </span>
            </div>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="space-y-5">
          <section class="card p-5 space-y-4">
            <div class="grid lg:grid-cols-[220px,1fr] gap-5">
              <div>
                <label class="label">{{ store.t('profilePhoto') }}</label>
                <input type="file" accept="image/*" class="input-field text-sm" @change="onAvatarSelected" />
                <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">{{ store.t('pngJpgUpTo10mb') }}</p>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div><label class="label">{{ store.t('firstName') }} *</label><input v-model="form.first_name" class="input-field" required /></div>
                <div><label class="label">{{ store.t('lastName') }} *</label><input v-model="form.last_name" class="input-field" required /></div>
                <div><label class="label">{{ store.t('phone') }} *</label><input v-model="form.phone" class="input-field" required /></div>
                <div><label class="label">{{ store.t('email') }}</label><input :value="authStore.user?.email || form.email" class="input-field" readonly /></div>
                <div><label class="label">{{ store.t('dateOfBirth') }} *</label><input v-model="form.birthday" class="input-field" type="date" required /></div>
                <div><label class="label">{{ store.t('homeAddress') }} *</label><input v-model="form.address" class="input-field" required /></div>
              </div>
            </div>
          </section>

          <section class="card p-5 space-y-4">
            <h3 class="text-sm font-semibold text-red-600 dark:text-red-400">{{ store.t('emergencyContact') }}</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div><label class="label">{{ store.t('contactName') }} *</label><input v-model="form.emergency_name" class="input-field" required /></div>
              <div><label class="label">{{ store.t('contactPhone') }} *</label><input v-model="form.emergency_phone" class="input-field" required /></div>
            </div>
          </section>

          <section class="card p-5 space-y-4">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('driverLicense') }}</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div><label class="label">{{ store.t('licenseNumber') }} *</label><input v-model="form.license_no" class="input-field" required /></div>
              <div>
                <label class="label">{{ store.t('licenseClass') }} *</label>
                <select v-model="form.license_class" class="input-field" required>
                  <option value="">{{ store.t('selectClass') }}</option>
                  <option v-for="option in licenseClasses" :key="option" :value="option">{{ option }}</option>
                </select>
              </div>
              <div><label class="label">{{ store.t('expiryDate') }} *</label><input v-model="form.license_expiry" class="input-field" type="date" required /></div>
              <div>
                <label class="label">{{ store.t('licensePhoto') }}</label>
                <input type="file" accept="image/*" class="input-field text-sm" @change="onLicenseSelected" />
              </div>
            </div>
            <img v-if="licensePreview" :src="licensePreview" alt="License document" class="h-40 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
          </section>

          <section class="card p-5 space-y-4">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('medicalCard') }}</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div><label class="label">{{ store.t('medicalCardNumber') }} *</label><input v-model="form.med_card_no" class="input-field" required /></div>
              <div><label class="label">{{ store.t('expiryDate') }} *</label><input v-model="form.med_card_expiry" class="input-field" type="date" required /></div>
            </div>
            <div>
              <label class="label">{{ store.t('medicalCardPhoto') }}</label>
              <input type="file" accept="image/*" class="input-field text-sm" @change="onMedicalSelected" />
            </div>
            <img v-if="medicalPreview" :src="medicalPreview" alt="Medical document" class="h-40 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
          </section>

          <div class="flex justify-end">
            <button type="submit" class="btn-primary px-6 py-2.5" :disabled="saving">{{ store.t('saveChanges') }}</button>
          </div>
        </form>
      </div>

      <div class="space-y-5">
        <section class="card p-5 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('businessAccess') }}</h3>
          <div
            v-for="membership in authStore.companyMemberships"
            :key="membership.company_id"
            class="rounded-xl border px-4 py-3 transition-colors"
            :class="membership.company_id === authStore.companyId
              ? 'border-blue-200 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700'"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ membership.company_name }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ membership.role }}</p>
              </div>
              <span v-if="membership.company_id === authStore.companyId" class="badge-blue">{{ store.t('activeBusiness') }}</span>
              <button
                v-else
                type="button"
                class="btn-secondary px-3 py-1.5 text-xs"
                @click="selectBusiness(membership.company_id)"
              >
                {{ store.t('switchBusiness') }}
              </button>
            </div>
          </div>
        </section>

        <section class="card p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('joinAnotherBusiness') }}</h3>
          <div>
            <label class="label">{{ store.t('enterBusinessCode') }}</label>
            <input v-model="joinCode" class="input-field" placeholder="DRV-ABCD-1234" />
          </div>
          <button type="button" class="btn-secondary w-full py-2.5" :disabled="authStore.loading || !joinCode.trim()" @click="joinBusiness">{{ store.t('joinBusiness') }}</button>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { uploadDriverAvatar, uploadDriverDocument } from '@/api/storage'

const store = useAppStore()
const authStore = useAuthStore()

const saving = ref(false)
const localError = ref('')
const message = ref('')
const joinCode = ref('')
const driverId = ref<string | null>(null)

const avatarFile = ref<File | null>(null)
const licenseFile = ref<File | null>(null)
const medicalFile = ref<File | null>(null)
const avatarPreview = ref('')
const licensePreview = ref('')
const medicalPreview = ref('')

const form = reactive({
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  birthday: '',
  address: '',
  emergency_name: '',
  emergency_phone: '',
  license_no: '',
  license_class: '',
  license_expiry: '',
  med_card_no: '',
  med_card_expiry: '',
  license_photo_url: '',
  med_card_photo_url: '',
})

const licenseClasses = ['Class A CDL', 'Class B CDL', 'Class C CDL', 'Class D', 'Class E', 'Motorcycle']

const displayName = computed(() => [form.first_name, form.last_name].filter(Boolean).join(' ').trim() || authStore.user?.email || 'Driver')
const statusLabel = computed(() => {
  if (authStore.profile?.status === 'pending') return store.t('statusPending')
  if (authStore.profile?.status === 'inactive') return store.t('statusInactive')
  return store.t('statusActive')
})
const statusBadge = computed(() => {
  if (authStore.profile?.status === 'pending') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  if (authStore.profile?.status === 'inactive') return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
})

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'DR'
}

function onAvatarSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  avatarFile.value = file
  avatarPreview.value = file ? URL.createObjectURL(file) : avatarPreview.value
}

function onLicenseSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  licenseFile.value = file
  licensePreview.value = file ? URL.createObjectURL(file) : licensePreview.value
}

function onMedicalSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  medicalFile.value = file
  medicalPreview.value = file ? URL.createObjectURL(file) : medicalPreview.value
}

async function loadDriverProfile() {
  if (!authStore.user?.id) {
    return
  }

  localError.value = ''

  const { data: driverData, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('auth_user_id', authStore.user.id)
    .maybeSingle()

  if (error) {
    localError.value = error.message
    return
  }

  if (!driverData) {
    return
  }

  driverId.value = driverData.id
  form.email = driverData.email || authStore.user.email || ''
  form.first_name = driverData.first_name || authStore.profile?.first_name || ''
  form.last_name = driverData.last_name || authStore.profile?.last_name || ''
  form.phone = driverData.phone || authStore.profile?.phone || ''
  form.birthday = driverData.birthday || ''
  form.address = driverData.address || ''
  form.emergency_name = driverData.emergency_name || ''
  form.emergency_phone = driverData.emergency_phone || ''
  form.license_no = driverData.license_no || ''
  form.license_class = driverData.license_class || ''
  form.license_expiry = driverData.license_expiry || ''
  form.med_card_no = driverData.med_card_no || ''
  form.med_card_expiry = driverData.med_card_expiry || ''
  form.license_photo_url = driverData.license_photo_url || ''
  form.med_card_photo_url = driverData.med_card_photo_url || ''
  avatarPreview.value = authStore.profile?.avatar_url || ''
  licensePreview.value = form.license_photo_url
  medicalPreview.value = form.med_card_photo_url
}

async function saveProfile() {
  if (!authStore.user?.id || !driverId.value) {
    localError.value = store.t('driverProfileNotFound')
    return
  }

  saving.value = true
  localError.value = ''
  message.value = ''

  try {
    const uploadKey = authStore.user.id
    const avatarUrl = avatarFile.value ? await uploadDriverAvatar(avatarFile.value, uploadKey) : authStore.profile?.avatar_url || null
    const licensePhotoUrl = licenseFile.value ? await uploadDriverDocument(licenseFile.value, uploadKey, 'licenses') : form.license_photo_url || null
    const medCardPhotoUrl = medicalFile.value ? await uploadDriverDocument(medicalFile.value, uploadKey, 'medical-cards') : form.med_card_photo_url || null

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        avatar_url: avatarUrl,
      })
      .eq('auth_user_id', authStore.user.id)

    if (profileError) {
      throw profileError
    }

    const { error: driverError } = await supabase
      .from('drivers')
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: authStore.user.email,
        phone: form.phone.trim(),
        birthday: form.birthday || null,
        address: form.address.trim(),
        emergency_name: form.emergency_name.trim(),
        emergency_phone: form.emergency_phone.trim(),
        license_no: form.license_no.trim(),
        license_class: form.license_class.trim(),
        license_expiry: form.license_expiry || null,
        med_card_no: form.med_card_no.trim(),
        med_card_expiry: form.med_card_expiry || null,
        license_photo_url: licensePhotoUrl,
        med_card_photo_url: medCardPhotoUrl,
      })
      .eq('id', driverId.value)

    if (driverError) {
      throw driverError
    }

    await authStore.fetchProfile()
    avatarPreview.value = avatarUrl || ''
    licensePreview.value = licensePhotoUrl || ''
    medicalPreview.value = medCardPhotoUrl || ''
    form.license_photo_url = licensePhotoUrl || ''
    form.med_card_photo_url = medCardPhotoUrl || ''
    message.value = store.t('driverProfileUpdated')
  } catch (error: any) {
    localError.value = error?.message || store.t('driverProfileSaveFailed')
  } finally {
    saving.value = false
  }
}

async function joinBusiness() {
  localError.value = ''
  message.value = ''

  const success = await authStore.joinDriverCompanyWithCode(joinCode.value)

  if (!success) {
    localError.value = authStore.error || store.t('joinBusinessFailed')
    return
  }

  joinCode.value = ''
  message.value = store.t('businessJoined')
}

function selectBusiness(companyId: string) {
  authStore.setActiveCompany(companyId)
}

onMounted(async () => {
  if (!authStore.user) {
    await authStore.loadSession()
  }

  await loadDriverProfile()
})
</script>