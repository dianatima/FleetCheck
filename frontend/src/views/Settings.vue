<template>
  <AppLayout :title="store.t('settings')">

    <!-- Horizontal tabs -->
    <div class="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
        :class="activeTab === tab.id
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Company Management -->
    <div v-if="activeTab === 'company'" class="space-y-5">
      <div class="card p-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white mb-2">Business Management</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              One owner can have more than five companies. There is no hard limit in the UI. Add as many businesses as your workspace needs.
            </p>
          </div>
          <div class="rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3 min-w-44">
            <p class="text-xs uppercase tracking-wide text-blue-500 dark:text-blue-300">Companies in workspace</p>
            <p class="text-2xl font-bold text-blue-700 dark:text-blue-200">{{ companies.length }}</p>
          </div>
        </div>

        <div v-if="authStore.error" class="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {{ authStore.error }}
        </div>
        <div v-else-if="companyActionMessage" class="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          {{ companyActionMessage }}
        </div>

        <div v-if="!authStore.isAuthenticated" class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p class="font-semibold mb-1">You are not signed in.</p>
          <p class="mb-3">Sign in to add companies to your workspace, or create your first company account from the registration flow.</p>
          <div class="flex flex-wrap gap-2">
            <RouterLink to="/login" class="btn-primary text-sm px-4 py-2">Sign in</RouterLink>
            <RouterLink to="/register/company" class="btn-secondary text-sm px-4 py-2">Create first company</RouterLink>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="card p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="font-semibold text-gray-900 dark:text-white">Your businesses</h3>
            <span class="text-xs text-gray-400 dark:text-gray-500">Unlimited list</span>
          </div>

          <div v-if="companies.length === 0" class="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No companies connected yet.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="company in companies"
              :key="company.company_id"
              class="rounded-2xl border px-4 py-4 transition-colors"
              :class="authStore.companyId === company.company_id
                ? 'border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1.5">
                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">{{ company.company_name }}</h4>
                    <span v-if="authStore.companyId === company.company_id" class="badge-green">Active</span>
                    <span class="badge-blue">{{ company.role }}</span>
                    <span v-if="company.status" class="badge-gray">{{ company.status }}</span>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ company.industry || 'No industry selected' }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatCompanyLocation(company) }}</p>
                </div>

                <div class="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    class="btn-secondary text-sm px-4 py-2"
                      :disabled="!authStore.isAuthenticated || authStore.companyId === company.company_id"
                    @click="switchCompany(company.company_id)"
                  >
                    {{ authStore.companyId === company.company_id ? 'Current' : 'Switch' }}
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl border text-sm font-medium transition-colors border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-40"
                    :disabled="!authStore.isAuthenticated"
                    @click="openDeleteCompany(company.company_id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card p-6">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Add business</h3>
            <form class="space-y-4" @submit.prevent="handleCreateCompany">
              <div>
                <label class="label">Company name *</label>
                <input v-model="createCompanyForm.name" class="input-field" placeholder="Prime Rentals" required />
              </div>
              <div>
                <label class="label">Industry</label>
                <select v-model="createCompanyForm.industry" class="input-field">
                  <option value="">Select industry</option>
                  <option v-for="o in industryOptions" :key="o">{{ o }}</option>
                </select>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">Country</label>
                  <select v-model="createCompanyForm.country" class="input-field" @change="handleCreateCompanyCountryChange">
                    <option v-for="country in prioritizedCountries" :key="country.code" :value="country.name">{{ country.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">City</label>
                  <input v-model="createCompanyForm.city" class="input-field" placeholder="Chicago" />
                </div>
              </div>
              <div>
                <label class="label">Phone</label>
                <input
                  :value="createCompanyForm.phone"
                  class="input-field"
                  :placeholder="selectedCreateCompanyCountry.phonePlaceholder"
                  inputmode="tel"
                  @input="handleCreateCompanyPhoneInput"
                />
              </div>
              <div>
                <label class="label">Address</label>
                <AddressAutocomplete v-model="createCompanyForm.address" :country="createCompanyForm.country" placeholder="123 Fleet Street" />
              </div>
              <button type="submit" class="btn-primary text-sm w-full justify-center" :disabled="!authStore.isAuthenticated || authStore.loading || !createCompanyForm.name.trim()">
                {{ authStore.loading ? 'Creating...' : 'Create company' }}
              </button>
            </form>
          </div>

          <div v-if="deleteTarget" class="card p-6 border border-red-200 dark:border-red-800">
            <h3 class="font-semibold text-red-600 dark:text-red-300 mb-2">Delete company</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You are deleting <span class="font-semibold text-gray-900 dark:text-white">{{ deleteTarget?.company_name }}</span>.
              This action removes the company from your workspace. If you are the last member, it will be archived.
            </p>
            <p class="text-sm text-red-600 dark:text-red-300 mb-4">
              {{ companies.length === 1
                ? store.t('lastBusinessDeleteWarning')
                : store.t('deleteBusinessAccessWarning') }}
            </p>
            <div class="space-y-4">
              <div>
                <label class="label">Confirm with your password</label>
                <input v-model="deletePassword" type="password" class="input-field" placeholder="Current password" />
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  :disabled="authStore.loading || !deletePassword"
                  @click="handleDeleteCompany"
                >
                  {{ authStore.loading ? 'Deleting...' : 'Delete company' }}
                </button>
                <button type="button" class="btn-secondary text-sm px-4 py-2" @click="closeDeleteCompany">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Language -->
    <div v-else-if="activeTab === 'language'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">{{ store.t('languageSettings') }}</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">{{ store.t('chooseLanguage') }}</p>
      <div class="space-y-2">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="store.setLanguage(lang.code)"
          class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all"
          :class="store.language === lang.code ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'"
        >
          <span class="text-2xl">{{ lang.flag }}</span>
          <div class="flex-1 text-left">
            <p class="font-medium" :class="store.language === lang.code ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'">{{ lang.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ lang.native }}</p>
          </div>
          <div v-if="store.language === lang.code" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <Check :size="13" class="text-white" />
          </div>
        </button>
      </div>
    </div>

    <!-- Theme -->
    <div v-else-if="activeTab === 'theme'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">{{ store.t('appearance') }}</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">{{ store.t('customizeAppearance') }}</p>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in themeOptions"
          :key="opt.id"
          @click="selectTheme(opt.id)"
          class="p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all"
          :class="appTheme === opt.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'"
        >
          <div class="w-full h-16 rounded-lg border flex items-center justify-center overflow-hidden" :class="opt.preview">
            <component :is="opt.icon" :size="20" :class="opt.iconClass" />
          </div>
          <span class="text-sm font-medium" :class="appTheme === opt.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'">{{ opt.label }}</span>
          <div v-if="appTheme === opt.id" class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><Check :size="11" class="text-white" /></div>
        </button>
      </div>
    </div>

  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Building2, Globe, Sun, Moon, Check } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import type { Language } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAuthStore } from '../stores/authStore'
import AddressAutocomplete from '../components/shared/AddressAutocomplete.vue'
import { formatPhoneByCountry, getCountryOption, getPreferredCountryCode, getPrioritizedCountries } from '@/lib/companyForm'

const store = useAppStore()
const authStore = useAuthStore()
const activeTab = ref('company')
const appTheme = ref<'light' | 'dark'>('light')
const companyActionMessage = ref('')
const deletePassword = ref('')
const deleteCompanyId = ref<string | null>(null)
const browserLocale = typeof navigator !== 'undefined' ? navigator.language : undefined
const defaultCountry = getCountryOption(getPreferredCountryCode(store.language, browserLocale))

const tabs = computed(() => [
  { id: 'company',  icon: Building2, label: store.t('companyProfile') },
  { id: 'language', icon: Globe,     label: store.t('languageSettings') },
  { id: 'theme',    icon: Sun,       label: store.t('appearance') },
])

const languages = [
  { code: 'en' as Language, flag: '🇺🇸', name: 'English',   native: 'English' },
  { code: 'uk' as Language, flag: '🇺🇦', name: 'Ukrainian', native: 'Українська' },
  { code: 'es' as Language, flag: '🇪🇸', name: 'Spanish',   native: 'Español' },
  { code: 'fr' as Language, flag: '🇫🇷', name: 'French',    native: 'Français' },
]

const themeOptions = computed(() => [
  { id: 'light', icon: Sun,  label: store.t('lightMode'), preview: 'bg-white border-gray-200',    iconClass: 'text-gray-700' },
  { id: 'dark',  icon: Moon, label: store.t('darkMode'),  preview: 'bg-gray-900 border-gray-700', iconClass: 'text-gray-200' },
])

function selectTheme(id: string) {
  appTheme.value = id as 'light' | 'dark'
  if (id === 'light' && store.theme === 'dark') store.toggleTheme()
  if (id === 'dark'  && store.theme === 'light') store.toggleTheme()
}

const industryOptions = ['Trucking / Freight', 'Construction Equipment', 'Boom Lift Rental', 'Delivery Fleet', 'Taxi / Passenger', 'Service Vehicles', 'Other']
const companies = computed(() => authStore.companyMemberships)
const deleteTarget = computed(() => companies.value.find((company) => company.company_id === deleteCompanyId.value) || null)
const prioritizedCountries = computed(() => getPrioritizedCountries(store.language, browserLocale))
const selectedCreateCompanyCountry = computed(() => getCountryOption(createCompanyForm.country))

const createCompanyForm = reactive({
  name: '',
  country: defaultCountry.name,
  state: '',
  city: '',
  address: '',
  phone: '',
  industry: '',
})

onMounted(async () => {
  if (!authStore.companyMemberships.length) {
    await authStore.fetchCompanyMemberships()
  }
})

function resetCreateCompanyForm() {
  createCompanyForm.name = ''
  createCompanyForm.country = defaultCountry.name
  createCompanyForm.state = ''
  createCompanyForm.city = ''
  createCompanyForm.address = ''
  createCompanyForm.phone = ''
  createCompanyForm.industry = ''
}

function formatCompanyLocation(company: {
  city?: string | null
  state?: string | null
  country?: string | null
  address?: string | null
}) {
  const location = [company.city, company.state, company.country].filter(Boolean).join(', ')

  if (location) {
    return location
  }

  return company.address || 'No location provided'
}

function handleCreateCompanyCountryChange() {
  createCompanyForm.phone = formatPhoneByCountry(createCompanyForm.phone, createCompanyForm.country)
}

function handleCreateCompanyPhoneInput(event: Event) {
  createCompanyForm.phone = formatPhoneByCountry((event.target as HTMLInputElement).value, createCompanyForm.country)
}

function switchCompany(companyId: string) {
  authStore.setActiveCompany(companyId)
  companyActionMessage.value = 'Active company updated.'
}

function openDeleteCompany(companyId: string) {
  deleteCompanyId.value = companyId
  deletePassword.value = ''
  companyActionMessage.value = ''
}

function closeDeleteCompany() {
  deleteCompanyId.value = null
  deletePassword.value = ''
}

async function handleCreateCompany() {
  companyActionMessage.value = ''

  const success = await authStore.createCompany({
    name: createCompanyForm.name.trim(),
    country: createCompanyForm.country.trim(),
    state: createCompanyForm.state.trim(),
    city: createCompanyForm.city.trim(),
    address: createCompanyForm.address.trim(),
    phone: createCompanyForm.phone.trim(),
    industry: createCompanyForm.industry.trim(),
  })

  if (!success) {
    return
  }

  companyActionMessage.value = 'Company created and added to your workspace.'
  resetCreateCompanyForm()
}

async function handleDeleteCompany() {
  if (!deleteTarget.value || !deletePassword.value) {
    return
  }

  companyActionMessage.value = ''

  const success = await authStore.deleteCompany(deleteTarget.value.company_id, deletePassword.value)

  if (!success) {
    return
  }

  companyActionMessage.value = `Company "${deleteTarget.value.company_name}" was removed from your workspace.`
  closeDeleteCompany()
}
</script>
