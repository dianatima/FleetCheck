<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck :size="18" class="text-white" />
          </div>
          <span class="font-bold text-gray-900 dark:text-white text-lg">{{ store.t('appName') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <RouterLink to="/register/company" class="btn-primary text-sm py-2">{{ store.t('getStarted') }}</RouterLink>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div class="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Star :size="14" />
              <span>{{ store.t('fleetManagementSaasPlatform') }}</span>
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              {{ store.t('tagline') }}
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {{ store.t('landingSubtitle') }}
            </p>
            <div class="flex flex-wrap gap-3">
              <RouterLink to="/register/company" class="btn-primary px-6 py-3 text-base gap-2">
                {{ store.t('getStarted') }} <ArrowRight :size="18" />
              </RouterLink>
              <RouterLink to="/login" class="btn-secondary px-6 py-3 text-base">{{ store.t('signIn') }}</RouterLink>
            </div>
          </div>

          <!-- Dashboard mockup -->
          <div class="relative hidden lg:block">
            <div class="relative mx-auto" style="max-width:480px">
              <div class="card shadow-2xl p-6">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('fleetOverview') }}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Today, May 12</p>
                  </div>
                  <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Truck :size="16" class="text-white" />
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-3 mb-5">
                  <div v-for="s in miniStats" :key="s.label" class="rounded-xl p-3 text-center" :class="s.bg">
                    <div class="text-xl font-bold" :class="s.text">{{ s.value }}</div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{{ s.label }}</div>
                  </div>
                </div>
                <!-- Chart bars -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ store.t('inspectionsThisWeek') }}</span>
                    <span class="text-xs text-green-500 font-medium">+12%</span>
                  </div>
                  <div class="flex items-end gap-1.5 h-16">
                    <div v-for="(h, i) in barData" :key="i" class="flex-1 rounded-t-sm bg-blue-200 dark:bg-blue-800 relative overflow-hidden" style="height:64px">
                      <div class="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm" :style="{ height: `${h}%` }" />
                    </div>
                  </div>
                  <div class="flex justify-between mt-1">
                    <span v-for="d in weekDays" :key="d" class="flex-1 text-center text-[9px] text-gray-400">{{ d }}</span>
                  </div>
                </div>
                <!-- Recent rows -->
                <div class="space-y-2">
                  <div v-for="r in recentRows" :key="r.unit" class="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Truck :size="12" class="text-gray-400" />
                      </div>
                      <div>
                        <p class="text-xs font-medium text-gray-900 dark:text-white">{{ r.unit }}</p>
                        <p class="text-[10px] text-gray-400">{{ r.driver }}</p>
                      </div>
                    </div>
                    <span :class="r.passed ? 'badge-green' : 'badge-red'">{{ r.passed ? store.t('statusPassed') : store.t('statusFailed') }}</span>
                  </div>
                </div>
              </div>
              <!-- Floating cards -->
              <div class="absolute -bottom-6 -left-10 w-44 card shadow-xl p-3">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle :size="12" class="text-white" />
                  </div>
                  <span class="text-xs font-semibold text-gray-900 dark:text-white">{{ store.t('preTripDone') }}</span>
                </div>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">Unit #1042 · {{ store.t('allItemsPassed') }}</p>
                <div class="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                  <div class="bg-green-500 h-1 rounded-full w-full" />
                </div>
              </div>
              <div class="absolute -top-4 -right-8 w-36 card shadow-xl p-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Wrench :size="11" class="text-white" />
                  </div>
                  <div>
                    <p class="text-[10px] font-semibold text-gray-900 dark:text-white">{{ store.t('repairTracking') }}</p>
                    <p class="text-[9px] text-orange-500">{{ store.t('highPriority') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats bar -->
    <section class="bg-blue-600 dark:bg-blue-700 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div v-for="s in stats" :key="s.label" class="text-center">
            <div class="text-3xl font-bold text-white">{{ s.value }}</div>
            <div class="text-blue-200 text-sm mt-1">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">{{ store.t('everythingYourFleetNeeds') }}</h2>
          <p class="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">{{ store.t('landingFeaturesIntro') }}</p>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="f in features" :key="f.title" class="card p-6 hover:shadow-md transition-shadow">
            <div class="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
              <component :is="f.icon" :size="22" class="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ f.title }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 dark:bg-gray-950 text-gray-400 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Truck :size="13" class="text-white" />
          </div>
          <span class="text-white font-semibold">FleetCheck Pro</span>
        </div>
        <p class="text-sm">{{ store.t('footerCopyright') }}</p>
        <LanguageSelector :compact="true" />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Truck, CheckCircle, ArrowRight, Star, Wrench, ClipboardCheck, BarChart3, Camera, Shield } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()

const barData = [60, 80, 55, 90, 70, 100, 85]
const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const miniStats = computed(() => [
  { label: store.t('availableVehicles'), value: '48', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  { label: store.t('inspections'), value: '127', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  { label: store.t('repairs'), value: '6', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
])

const recentRows = [
  { unit: 'Unit #1042', driver: 'J. Smith', passed: true },
  { unit: 'Unit #0781', driver: 'M. Garcia', passed: false },
  { unit: 'Unit #2210', driver: 'D. Lee', passed: true },
]

const stats = computed(() => [
  { value: '10,000+', label: store.t('inspectionsDaily') },
  { value: '500+', label: store.t('companies') },
  { value: '99.9%', label: store.t('uptime') },
  { value: '50+', label: store.t('countries') },
])

const features = computed(() => [
  { icon: ClipboardCheck, title: store.t('digitalInspections'), desc: store.t('digitalInspectionsDesc') },
  { icon: Truck, title: store.t('fleetManagement'), desc: store.t('fleetManagementDesc') },
  { icon: Shield, title: store.t('complianceReady'), desc: store.t('complianceReadyDesc') },
  { icon: Camera, title: store.t('photoEvidence'), desc: store.t('photoEvidenceDesc') },
  { icon: Wrench, title: store.t('repairTracking'), desc: store.t('repairTrackingDesc') },
  { icon: BarChart3, title: store.t('analyticsReports'), desc: store.t('analyticsReportsDesc') },
])
</script>
