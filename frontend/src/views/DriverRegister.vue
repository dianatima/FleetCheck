<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/login" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft :size="16" /> {{ store.t('backToLogin') }}
        </RouterLink>
        <div class="flex items-center gap-2">
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
          <UserPlus :size="24" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.t('driverRegistration') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">{{ store.t('driverRegSubtitle') }}</p>
      </div>

      <div class="card p-6 shadow-sm">
        <div v-if="localError || authStore.error" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
          {{ localError || authStore.error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <label class="label text-blue-700 dark:text-blue-300">{{ store.t('invitationCode') }} *</label>
            <div class="flex gap-2 mt-1">
              <input v-model="inviteCode" class="input-field bg-white dark:bg-gray-800" placeholder="e.g. DRV-ABCD-1234" required @blur="resolveInvite" />
              <button type="button" class="btn-secondary px-4 py-2 text-sm" :disabled="checkingInvite || !inviteCode.trim()" @click="resolveInvite">
                {{ checkingInvite ? store.t('checkingInvite') : store.t('verifyInvite') }}
              </button>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1.5">{{ store.t('askManagerForCode') }}</p>
            <p v-if="inviteCompanyName" class="mt-2 text-sm font-medium text-blue-700 dark:text-blue-200">
              {{ store.t('invitationFoundFor') }} {{ inviteCompanyName }}
            </p>
          </div>

          <section class="space-y-4">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('driverProfile') }}</h2>
            <div class="grid lg:grid-cols-[220px,1fr] gap-5">
              <div>
                <label class="label">{{ store.t('profilePhoto') }}</label>
                <div class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center bg-gray-50 dark:bg-gray-800/60">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar preview" class="mx-auto h-28 w-28 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 mb-3" />
                  <div v-else class="mx-auto h-28 w-28 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-2xl font-bold mb-3">
                    {{ firstInitials }}
                  </div>
                  <input type="file" accept="image/*" class="input-field text-sm" @change="onAvatarSelected" />
                  <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">{{ store.t('pngJpgUpTo10mb') }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('firstName') }} *</label>
                    <input v-model="firstName" class="input-field" :class="inputClass('firstName')" placeholder="John" required />
                    <p v-if="fieldMessage('firstName')" class="mt-1 text-xs text-red-500">{{ fieldMessage('firstName') }}</p>
                  </div>
                  <div>
                    <label class="label">{{ store.t('lastName') }} *</label>
                    <input v-model="lastName" class="input-field" :class="inputClass('lastName')" placeholder="Smith" required />
                    <p v-if="fieldMessage('lastName')" class="mt-1 text-xs text-red-500">{{ fieldMessage('lastName') }}</p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('phone') }} *</label>
                    <input :value="phone" class="input-field" :class="inputClass('phone')" type="tel" :placeholder="businessCountryOption.phonePlaceholder" inputmode="tel" required @input="handlePhoneInput('phone', $event)" />
                    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ store.t('businessPhoneHint') }} {{ businessCountryOption.name }}</p>
                    <p v-if="fieldMessage('phone')" class="mt-1 text-xs text-red-500">{{ fieldMessage('phone') }}</p>
                  </div>
                  <div>
                    <label class="label">{{ store.t('email') }} *</label>
                    <input v-model="email" class="input-field" :class="inputClass('email')" type="email" placeholder="john@email.com" required />
                    <p v-if="fieldMessage('email')" class="mt-1 text-xs text-red-500">{{ fieldMessage('email') }}</p>
                  </div>
                </div>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('dateOfBirth') }} *</label>
                    <input v-model="birthday" class="input-field" :class="inputClass('birthday')" type="date" required />
                    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ ageRequirementHint }}</p>
                    <p v-if="fieldMessage('birthday')" class="mt-1 text-xs text-red-500">{{ fieldMessage('birthday') }}</p>
                  </div>
                  <div class="flex items-end">
                    <button type="button" class="btn-secondary w-full py-2.5 text-sm" :disabled="locatingAddress" @click="prefillAddressFromDevice">
                      {{ locatingAddress ? store.t('detectingLocation') : store.t('useCurrentLocation') }}
                    </button>
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('country') }} *</label>
                    <select v-model="country" class="input-field" :class="inputClass('country')" required>
                      <option v-for="option in prioritizedCountries" :key="option.code" :value="option.name">{{ option.name }}</option>
                    </select>
                    <p v-if="fieldMessage('country')" class="mt-1 text-xs text-red-500">{{ fieldMessage('country') }}</p>
                  </div>
                  <div>
                    <label class="label">{{ store.t('stateProvince') }} *</label>
                    <input v-model="state" class="input-field" :class="inputClass('state')" placeholder="California" required />
                    <p v-if="fieldMessage('state')" class="mt-1 text-xs text-red-500">{{ fieldMessage('state') }}</p>
                  </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('city') }} *</label>
                    <input v-model="city" class="input-field" :class="inputClass('city')" placeholder="Los Angeles" required />
                    <p v-if="fieldMessage('city')" class="mt-1 text-xs text-red-500">{{ fieldMessage('city') }}</p>
                  </div>
                  <div>
                    <label class="label">{{ store.t('postalCode') }} *</label>
                    <input v-model="postalCode" class="input-field" :class="inputClass('postalCode')" placeholder="90001" required />
                    <p v-if="fieldMessage('postalCode')" class="mt-1 text-xs text-red-500">{{ fieldMessage('postalCode') }}</p>
                  </div>
                </div>

                <div>
                  <label class="label">{{ store.t('streetAddress') }} *</label>
                  <AddressAutocomplete v-model="streetAddress" :country="country" :input-class="inputClass('streetAddress')" placeholder="123 Main St" />
                  <p v-if="fieldMessage('streetAddress')" class="mt-1 text-xs text-red-500">{{ fieldMessage('streetAddress') }}</p>
                </div>
              </div>
            </div>
          </section>

          <section class="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/40 dark:bg-red-900/10 space-y-4">
            <h2 class="text-sm font-semibold text-red-600 dark:text-red-400">{{ store.t('emergencyContact') }}</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label">{{ store.t('contactName') }} *</label>
                <input v-model="emergencyName" class="input-field" :class="inputClass('emergencyName')" placeholder="Jane Doe" required />
                <p v-if="fieldMessage('emergencyName')" class="mt-1 text-xs text-red-500">{{ fieldMessage('emergencyName') }}</p>
              </div>
              <div>
                <label class="label">{{ store.t('contactPhone') }} *</label>
                <input :value="emergencyPhone" class="input-field" :class="inputClass('emergencyPhone')" :placeholder="businessCountryOption.phonePlaceholder" inputmode="tel" required @input="handlePhoneInput('emergencyPhone', $event)" />
                <p v-if="fieldMessage('emergencyPhone')" class="mt-1 text-xs text-red-500">{{ fieldMessage('emergencyPhone') }}</p>
              </div>
            </div>
          </section>

          <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('driverLicense') }}</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label">{{ store.t('licenseNumber') }} *</label>
                <input v-model="licenseNo" class="input-field" :class="inputClass('licenseNo')" placeholder="DL123456789" required />
                <p v-if="fieldMessage('licenseNo')" class="mt-1 text-xs text-red-500">{{ fieldMessage('licenseNo') }}</p>
              </div>
              <div>
                <label class="label">{{ store.t('licenseClass') }} *</label>
                <select v-model="licenseClass" class="input-field" :class="inputClass('licenseClass')" required>
                  <option value="">{{ store.t('selectClass') }}</option>
                  <option v-for="option in licenseClasses" :key="option" :value="option">{{ option }}</option>
                </select>
                <p v-if="fieldMessage('licenseClass')" class="mt-1 text-xs text-red-500">{{ fieldMessage('licenseClass') }}</p>
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label">{{ store.t('expiryDate') }} *</label>
                <input v-model="licenseExpiry" class="input-field" :class="inputClass('licenseExpiry')" type="date" required />
                <p v-if="fieldMessage('licenseExpiry')" class="mt-1 text-xs text-red-500">{{ fieldMessage('licenseExpiry') }}</p>
              </div>
              <div>
                <label class="label">{{ store.t('licensePhoto') }}</label>
                <input type="file" accept="image/*" class="input-field text-sm" @change="onLicenseSelected" />
              </div>
            </div>
            <img v-if="licensePreview" :src="licensePreview" alt="License preview" class="h-36 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
          </section>

          <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('medicalCard') }}</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label">{{ store.t('medicalCardNumber') }} *</label>
                <input v-model="medCardNo" class="input-field" :class="inputClass('medCardNo')" placeholder="MC-123456" required />
                <p v-if="fieldMessage('medCardNo')" class="mt-1 text-xs text-red-500">{{ fieldMessage('medCardNo') }}</p>
              </div>
              <div>
                <label class="label">{{ store.t('expiryDate') }} *</label>
                <input v-model="medCardExpiry" class="input-field" :class="inputClass('medCardExpiry')" type="date" required />
                <p v-if="fieldMessage('medCardExpiry')" class="mt-1 text-xs text-red-500">{{ fieldMessage('medCardExpiry') }}</p>
              </div>
            </div>
            <div>
              <label class="label">{{ store.t('medicalCardPhoto') }}</label>
              <input type="file" accept="image/*" class="input-field text-sm" @change="onMedicalSelected" />
            </div>
            <img v-if="medicalPreview" :src="medicalPreview" alt="Medical card preview" class="h-36 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
          </section>

          <section class="space-y-4">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ store.t('createYourAccount') }}</h2>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label">{{ store.t('password') }} *</label>
                <div class="relative">
                  <input v-model="password" :type="showPass ? 'text' : 'password'" class="input-field pr-10" :class="inputClass('password')" :placeholder="store.t('min8Chars')" required />
                  <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <EyeOff v-if="showPass" :size="16" /><Eye v-else :size="16" />
                  </button>
                </div>
                <p v-if="fieldMessage('password')" class="mt-1 text-xs text-red-500">{{ fieldMessage('password') }}</p>
              </div>
              <div>
                <label class="label">{{ store.t('confirmPassword') }} *</label>
                <div class="relative">
                  <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" class="input-field pr-10" :class="inputClass('confirmPassword')" :placeholder="store.t('repeatPassword')" required />
                  <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <EyeOff v-if="showConfirm" :size="16" /><Eye v-else :size="16" />
                  </button>
                </div>
                <p v-if="fieldMessage('confirmPassword')" class="mt-1 text-xs text-red-500">{{ fieldMessage('confirmPassword') }}</p>
              </div>
            </div>
          </section>

          <button type="submit" class="btn-primary w-full py-3 text-base gap-2" :disabled="authStore.loading">
            <UserPlus :size="18" /> {{ authStore.loading ? store.t('creating') : store.t('createDriverAccount') }}
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-vue-next'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { uploadDriverAvatar, uploadDriverDocument } from '@/api/storage'
import { formatPhoneByCountry, getCountryOption, getPreferredCountryCode, getPrioritizedCountries } from '@/lib/companyForm'
import { supabase } from '@/lib/supabase'
import AddressAutocomplete from '../components/shared/AddressAutocomplete.vue'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const browserLocale = typeof navigator !== 'undefined' ? navigator.language : undefined
const defaultCountry = getCountryOption(getPreferredCountryCode(store.language, browserLocale))

const inviteCode = ref(typeof route.query.code === 'string' ? route.query.code : '')
const inviteCompanyName = ref('')
const businessCountry = ref(defaultCountry.name)
const checkingInvite = ref(false)
const showPass = ref(false)
const showConfirm = ref(false)
const localError = ref('')
const locatingAddress = ref(false)

const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const email = ref('')
const birthday = ref('')
const country = ref(defaultCountry.name)
const state = ref('')
const city = ref('')
const postalCode = ref('')
const streetAddress = ref('')
const emergencyName = ref('')
const emergencyPhone = ref('')
const licenseNo = ref('')
const licenseClass = ref('')
const licenseExpiry = ref('')
const medCardNo = ref('')
const medCardExpiry = ref('')
const password = ref('')
const confirmPassword = ref('')

const avatarFile = ref<File | null>(null)
const licenseFile = ref<File | null>(null)
const medicalFile = ref<File | null>(null)
const avatarPreview = ref('')
const licensePreview = ref('')
const medicalPreview = ref('')
const invalidFields = reactive<Record<string, boolean>>({})
const errorMessages = reactive<Record<string, string>>({})

const licenseClasses = ['Class A CDL', 'Class B CDL', 'Class C CDL', 'Class D', 'Class E', 'Motorcycle']
const prioritizedCountries = computed(() => getPrioritizedCountries(store.language, browserLocale))
const businessCountryOption = computed(() => getCountryOption(businessCountry.value || country.value))
const ageRequirementHint = computed(() => {
  return licenseClass.value.includes('CDL')
    ? store.t('driverMustBe21ForCommercial')
    : store.t('driverMustBe18')
})
const fullAddress = computed(() => {
  return [
    streetAddress.value.trim(),
    city.value.trim(),
    state.value.trim(),
    postalCode.value.trim(),
    country.value.trim(),
  ].filter(Boolean).join(', ')
})

const firstInitials = computed(() => {
  const letters = `${firstName.value} ${lastName.value}`.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('')
  return letters.toUpperCase() || 'DR'
})

function inputClass(field: string) {
  return invalidFields[field]
    ? 'border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-200 dark:border-red-700 dark:bg-red-900/10'
    : ''
}

function fieldMessage(field: string) {
  return errorMessages[field] || ''
}

function resetValidation() {
  Object.keys(invalidFields).forEach((key) => delete invalidFields[key])
  Object.keys(errorMessages).forEach((key) => delete errorMessages[key])
}

function markInvalid(field: string, message = '') {
  invalidFields[field] = true
  if (message) {
    errorMessages[field] = message
  }
}

function formatPhoneValue(value: string) {
  return formatPhoneByCountry(value, businessCountry.value || country.value)
}

function handlePhoneInput(target: 'phone' | 'emergencyPhone', event: Event) {
  const formatted = formatPhoneValue((event.target as HTMLInputElement).value)

  if (target === 'phone') {
    phone.value = formatted
    return
  }

  emergencyPhone.value = formatted
}

function getRequiredAge() {
  return licenseClass.value.includes('CDL') ? 21 : 18
}

function getAge(dateValue: string) {
  const birthDate = new Date(dateValue)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

function isPhoneValid(value: string) {
  const parsed = parsePhoneNumberFromString(value, businessCountryOption.value.code as CountryCode)
  return Boolean(parsed?.isValid())
}

function validateForm() {
  resetValidation()

  const requiredValues: Array<[string, string]> = [
    ['inviteCode', inviteCode.value.trim()],
    ['firstName', firstName.value.trim()],
    ['lastName', lastName.value.trim()],
    ['phone', phone.value.trim()],
    ['email', email.value.trim()],
    ['birthday', birthday.value],
    ['country', country.value.trim()],
    ['state', state.value.trim()],
    ['city', city.value.trim()],
    ['postalCode', postalCode.value.trim()],
    ['streetAddress', streetAddress.value.trim()],
    ['emergencyName', emergencyName.value.trim()],
    ['emergencyPhone', emergencyPhone.value.trim()],
    ['licenseNo', licenseNo.value.trim()],
    ['licenseClass', licenseClass.value.trim()],
    ['licenseExpiry', licenseExpiry.value],
    ['medCardNo', medCardNo.value.trim()],
    ['medCardExpiry', medCardExpiry.value],
    ['password', password.value],
    ['confirmPassword', confirmPassword.value],
  ]

  requiredValues.forEach(([field, value]) => {
    if (!value) {
      markInvalid(field)
    }
  })

  if (birthday.value) {
    const minAge = getRequiredAge()
    const actualAge = getAge(birthday.value)

    if (actualAge < minAge) {
      markInvalid('birthday', minAge === 21 ? store.t('driverMustBe21ForCommercial') : store.t('driverMustBe18'))
    }
  }

  if (phone.value.trim() && !isPhoneValid(phone.value.trim())) {
    markInvalid('phone', store.t('phoneMustMatchBusinessCountry'))
  }

  if (emergencyPhone.value.trim() && !isPhoneValid(emergencyPhone.value.trim())) {
    markInvalid('emergencyPhone', store.t('phoneMustMatchBusinessCountry'))
  }

  if (password.value && password.value.length < 8) {
    markInvalid('password', store.t('min8Chars'))
  }

  if (password.value !== confirmPassword.value) {
    markInvalid('confirmPassword', store.t('passwordsDoNotMatch'))
  }

  if (Object.keys(invalidFields).length > 0) {
    localError.value = Object.values(errorMessages)[0] || store.t('completeHighlightedFields')
    return false
  }

  return true
}

function onAvatarSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  avatarFile.value = file
  avatarPreview.value = file ? URL.createObjectURL(file) : ''
}

function onLicenseSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  licenseFile.value = file
  licensePreview.value = file ? URL.createObjectURL(file) : ''
}

function onMedicalSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  medicalFile.value = file
  medicalPreview.value = file ? URL.createObjectURL(file) : ''
}

async function resolveInvite() {
  const code = inviteCode.value.trim().toUpperCase()
  if (!code) {
    inviteCompanyName.value = ''
    return
  }

  checkingInvite.value = true
  const invite = await authStore.getDriverInviteByCode(code)
  inviteCompanyName.value = invite?.company_name || ''
  businessCountry.value = invite?.country || businessCountry.value
  phone.value = formatPhoneValue(phone.value)
  emergencyPhone.value = formatPhoneValue(emergencyPhone.value)
  checkingInvite.value = false
}

async function prefillAddressFromDevice() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    localError.value = store.t('locationAutofillFailed')
    return
  }

  locatingAddress.value = true
  localError.value = ''

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      })
    })

    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(position.coords.latitude),
      lon: String(position.coords.longitude),
      addressdetails: '1',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error('Reverse address lookup failed')
    }

    const data = await response.json() as {
      address?: Record<string, string>
    }

    const addressData = data.address || {}
    const street = [addressData.house_number, addressData.road].filter(Boolean).join(' ').trim()

    streetAddress.value = street || addressData.neighbourhood || addressData.suburb || streetAddress.value
    city.value = addressData.city || addressData.town || addressData.village || city.value
    state.value = addressData.state || addressData.region || addressData.county || state.value
    postalCode.value = addressData.postcode || postalCode.value
    country.value = addressData.country || country.value
  } catch {
    localError.value = store.t('locationAutofillFailed')
  } finally {
    locatingAddress.value = false
  }
}

async function handleSubmit() {
  localError.value = ''

  if (!validateForm()) {
    return
  }

  try {
    const success = await authStore.registerDriverWithInvite({
      code: inviteCode.value,
      first_name: firstName.value.trim(),
      last_name: lastName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      password: password.value,
      birthday: birthday.value || undefined,
      address: fullAddress.value,
      emergency_name: emergencyName.value.trim(),
      emergency_phone: emergencyPhone.value.trim(),
      license_no: licenseNo.value.trim(),
      license_class: licenseClass.value.trim(),
      license_expiry: licenseExpiry.value || undefined,
      med_card_no: medCardNo.value.trim(),
      med_card_expiry: medCardExpiry.value || undefined,
      avatar_url: null,
      license_photo_url: null,
      med_card_photo_url: null,
    })

    if (success) {
      await uploadDriverAssetsAfterRegistration()
      router.push('/pending')
    }
  } catch (error: any) {
    localError.value = error?.message || store.t('driverDocumentsUploadFailed')
  }
}

async function uploadDriverAssetsAfterRegistration() {
  if (!avatarFile.value && !licenseFile.value && !medicalFile.value) {
    return
  }

  const userId = authStore.user?.id

  if (!userId) {
    return
  }

  const uploadKey = userId || email.value.trim().toLowerCase() || crypto.randomUUID()
  const avatarUrl = avatarFile.value ? await uploadDriverAvatar(avatarFile.value, uploadKey) : null
  const licensePhotoUrl = licenseFile.value ? await uploadDriverDocument(licenseFile.value, uploadKey, 'licenses') : null
  const medCardPhotoUrl = medicalFile.value ? await uploadDriverDocument(medicalFile.value, uploadKey, 'medical-cards') : null

  if (avatarUrl) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('auth_user_id', userId)

    if (profileError) {
      throw profileError
    }
  }

  if (licensePhotoUrl || medCardPhotoUrl) {
    const { error: driverError } = await supabase
      .from('drivers')
      .update({
        license_photo_url: licensePhotoUrl,
        med_card_photo_url: medCardPhotoUrl,
      })
      .eq('auth_user_id', userId)

    if (driverError) {
      throw driverError
    }
  }
}

onMounted(() => {
  if (inviteCode.value.trim()) {
    resolveInvite()
  }
})
</script>
