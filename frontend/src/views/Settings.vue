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

    <!-- Company Profile -->
    <div v-if="activeTab === 'company'" class="card p-6">
      <h2 class="font-bold text-gray-900 dark:text-white mb-5">{{ store.t('companyProfile') }}</h2>

      <div class="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="label">{{ store.t('companyName') }}</label>
          <input v-model="companyForm.companyName" class="input-field" placeholder="Acme Trucking Inc." />
        </div>
        <div>
          <label class="label">{{ store.t('phone') }}</label>
          <input v-model="companyForm.phone" class="input-field" type="tel" placeholder="+1 (555) 000-0000" />
        </div>
      </div>

      <div class="mb-4">
        <label class="label">{{ store.t('address') }}</label>
        <input v-model="companyForm.address" class="input-field" placeholder="123 Fleet Street" />
      </div>

      <div class="mb-6">
        <label class="label">{{ store.t('industryType') }}</label>
        <select v-model="companyForm.industry" class="input-field">
          <option v-for="o in industryOptions" :key="o">{{ o }}</option>
        </select>
      </div>

      <div class="border-t border-gray-100 dark:border-gray-700 pt-5 mb-5">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ store.t('fleetManager') }}</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">{{ store.t('firstName') }}</label>
            <input v-model="managerForm.firstName" class="input-field" placeholder="John" />
          </div>
          <div>
            <label class="label">{{ store.t('lastName') }}</label>
            <input v-model="managerForm.lastName" class="input-field" placeholder="Smith" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">{{ store.t('phone') }}</label>
            <input v-model="managerForm.phone" class="input-field" type="tel" placeholder="+1 (555) 000-0000" />
          </div>
        </div>
      </div>

      <button class="btn-primary text-sm">{{ store.t('save') }}</button>
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
import { ref, reactive, computed } from 'vue'
import { Building2, Globe, Sun, Moon, Check } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import type { Language } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'

const store = useAppStore()
const activeTab = ref('company')
const appTheme = ref<'light' | 'dark'>('light')

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

const companyForm = reactive({
  companyName: 'Acme Trucking Inc.',
  phone: '+1 (555) 234-5678',
  address: '456 Fleet Ave, Los Angeles, CA',
  industry: 'Trucking / Freight',
})

const managerForm = reactive({
  firstName: 'James',
  lastName: 'Davis',
  phone: '+1 (555) 987-6543',
})
</script>
