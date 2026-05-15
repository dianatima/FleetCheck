<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft :size="16" /> {{ store.t('back') }}
        </RouterLink>
        <div class="flex items-center gap-2">
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <!-- Step progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between relative">
          <div class="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0" />
          <div class="absolute left-0 top-4 h-0.5 bg-blue-500 -z-0 transition-all duration-500" :style="{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }" />
          <div v-for="s in steps" :key="s.id" class="flex flex-col items-center gap-2 relative z-10">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              :class="s.id < step ? 'bg-blue-600 text-white' : s.id === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400'"
            >
              <CheckCircle v-if="s.id < step" :size="16" />
              <component v-else :is="s.icon" :size="14" />
            </div>
            <span class="text-xs font-medium hidden sm:block" :class="s.id === step ? 'text-blue-600 dark:text-blue-400' : s.id < step ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Step content -->
      <div class="card p-6 shadow-sm">

        <!-- Step 1: Account Credentials -->
        <div v-if="step === 1">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ store.t('createYourAccount') }}</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">{{ store.t('enterLoginCredentials') }}</p>
          <div class="space-y-4">
            <div>
              <label class="label">{{ store.t('emailField') }} *</label>
              <input v-model="email" class="input-field" type="email" placeholder="you@company.com" />
            </div>
            <div>
              <label class="label">{{ store.t('password') }} *</label>
              <div class="relative">
                <input v-model="password" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" />
                <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <EyeOff v-if="showPass" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-1">{{ store.t('atLeast8Chars') }}</p>
            </div>
            <div>
              <label class="label">{{ store.t('confirmPassword') }} *</label>
              <div class="relative">
                <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" />
                <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <EyeOff v-if="showConfirm" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>
              <p v-if="confirmPassword && password !== confirmPassword" class="text-xs text-red-500 mt-1">{{ store.t('passwordsDoNotMatch') }}</p>
              <p v-else-if="confirmPassword && password === confirmPassword" class="text-xs text-green-500 mt-1">{{ store.t('passwordsMatch') }}</p>
            </div>
          </div>
        </div>

        <!-- Step 2: Company Info -->
        <div v-else-if="step === 2">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ store.t('companyInformation') }}</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Tell us about your company.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="label">{{ store.t('companyName') }} *</label>
              <input v-model="company.name" class="input-field" placeholder="Acme Trucking Inc." />
            </div>
            <div>
              <label class="label">{{ store.t('country') }} *</label>
              <select v-model="company.country" class="input-field">
                <option>United States</option>
                <option>Canada</option>
                <option>Ukraine</option>
                <option>Mexico</option>
                <option>France</option>
                <option>Spain</option>
              </select>
            </div>
            <div>
              <label class="label">{{ store.t('stateProvince') }}</label>
              <input v-model="company.state" class="input-field" placeholder="California" />
            </div>
            <div>
              <label class="label">{{ store.t('city') }}</label>
              <input v-model="company.city" class="input-field" placeholder="Los Angeles" />
            </div>
            <div>
              <label class="label">{{ store.t('phone') }}</label>
              <input v-model="company.phone" class="input-field" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div class="sm:col-span-2">
              <label class="label">{{ store.t('address') }}</label>
              <input v-model="company.address" class="input-field" placeholder="123 Fleet Street" />
            </div>
            <div class="sm:col-span-2">
              <label class="label">{{ store.t('industryType') }}</label>
              <select v-model="company.industry" class="input-field">
                <option v-for="o in industryOptions" :key="o">{{ o }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 3: Manager Info -->
        <div v-else-if="step === 3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ store.t('fleetManager') }}</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Provide the contact details of the fleet manager.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="label">{{ store.t('firstName') }} *</label>
              <input v-model="manager.firstName" class="input-field" placeholder="John" />
            </div>
            <div>
              <label class="label">{{ store.t('lastName') }} *</label>
              <input v-model="manager.lastName" class="input-field" placeholder="Smith" />
            </div>
            <div class="sm:col-span-2">
              <label class="label">{{ store.t('phone') }} *</label>
              <input v-model="manager.phone" class="input-field" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>

        <!-- Step 4: Done -->
        <div v-else-if="step === 4" class="text-center py-6">
          <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle :size="40" class="text-green-500" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ store.t('workspaceReady') }}</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-2">{{ store.t('workspaceSetupSuccess') }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-8">{{ store.t('workspaceSetupInfo') }}</p>
          <RouterLink to="/dashboard" class="btn-primary px-8 py-3 text-base gap-2 inline-flex">{{ store.t('goToDashboard') }} <ArrowRight :size="18" /></RouterLink>
        </div>
      </div>

      <div v-if="step < steps.length" class="flex items-center justify-between mt-5">
        <button @click="step > 1 && step--" :disabled="step === 1" class="btn-secondary gap-2 disabled:opacity-40">
          <ArrowLeft :size="16" /> {{ store.t('back') }}
        </button>
        <span class="text-sm text-gray-400">{{ step }} / {{ steps.length }}</span>
        <button @click="handleNext" :disabled="step === 1 && !canProceedStep1" class="btn-primary gap-2 disabled:opacity-40">
          {{ store.t('next') }} <ArrowRight :size="16" />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ArrowLeft, ArrowRight, Building2, CheckCircle, KeyRound, CircleUser as UserCircle, Eye, EyeOff } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()
const step = ref(1)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const showConfirm = ref(false)

const company = reactive({
  name: '',
  country: 'United States',
  state: '',
  city: '',
  phone: '',
  address: '',
  industry: 'Trucking / Freight',
})

const manager = reactive({
  firstName: '',
  lastName: '',
  phone: '',
})


const canProceedStep1 = computed(() =>
  email.value.length > 0 &&
  password.value.length >= 8 &&
  password.value === confirmPassword.value
)

function handleNext() {
  if (step.value === 1 && !canProceedStep1.value) return
  if (step.value < steps.value.length) step.value++
}

const steps = computed(() => [
  { id: 1, icon: KeyRound,    label: store.t('createYourAccount') },
  { id: 2, icon: Building2,   label: store.t('companyInformation') },
  { id: 3, icon: UserCircle,  label: store.t('fleetManager') },
  { id: 4, icon: CheckCircle, label: store.t('finish') },
])

const industryOptions = computed(() => [
  store.t('truckingCompany'),
  store.t('constructionEquipment'),
  store.t('boomLiftRental'),
  store.t('deliveryFleet'),
  store.t('taxiPassenger'),
  store.t('serviceVehicles'),
  store.t('otherFleet'),
])
</script>
