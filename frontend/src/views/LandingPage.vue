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
          <RouterLink to="/login" class="hidden sm:flex btn-secondary text-sm py-2">{{ store.t('companyLogin') }}</RouterLink>
          <RouterLink to="/department" class="btn-primary text-sm py-2">{{ store.t('getStarted') }}</RouterLink>
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
              <span>Trusted by 500+ fleet companies</span>
            </div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              {{ store.t('tagline') }}
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Streamline pre-trip and post-trip inspections, manage your fleet, track vehicle conditions, photos, repairs, and stay compliant — all from one platform.
            </p>
            <div class="flex flex-wrap gap-3">
              <RouterLink to="/department" class="btn-primary px-6 py-3 text-base gap-2">
                {{ store.t('getStarted') }} <ArrowRight :size="18" />
              </RouterLink>
              <RouterLink to="/login" class="btn-secondary px-6 py-3 text-base">{{ store.t('companyLogin') }}</RouterLink>
              <RouterLink to="/register/driver" class="btn-secondary px-6 py-3 text-base text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">{{ store.t('driverRegistration') }}</RouterLink>
            </div>
            <div class="flex flex-wrap items-center gap-4 mt-8">
              <div v-for="item in checkItems" :key="item" class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle :size="14" class="text-green-500" />
                {{ item }}
              </div>
            </div>
          </div>

          <!-- Dashboard mockup -->
          <div class="relative hidden lg:block">
            <div class="relative mx-auto" style="max-width:480px">
              <div class="card shadow-2xl p-6">
                <div class="flex items-center justify-between mb-5">
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Fleet Overview</h3>
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
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Inspections This Week</span>
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
                    <span :class="r.status === 'Passed' ? 'badge-green' : 'badge-red'">{{ r.status }}</span>
                  </div>
                </div>
              </div>
              <!-- Floating cards -->
              <div class="absolute -bottom-6 -left-10 w-44 card shadow-xl p-3">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle :size="12" class="text-white" />
                  </div>
                  <span class="text-xs font-semibold text-gray-900 dark:text-white">Pre-Trip Done</span>
                </div>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">Unit #1042 · All items passed</p>
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
                    <p class="text-[10px] font-semibold text-gray-900 dark:text-white">Repair Request</p>
                    <p class="text-[9px] text-orange-500">High Priority</p>
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
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything your fleet needs</h2>
          <p class="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">From daily driver checklists to compliance reports, FleetCheck Pro keeps your entire fleet operation running smoothly.</p>
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

    <!-- CTA -->
    <section class="py-16 bg-white dark:bg-gray-800">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to modernize your fleet?</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">Join thousands of fleet managers who trust FleetCheck Pro for their daily operations.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <RouterLink to="/department" class="btn-primary px-8 py-3 text-base">Start Free Trial</RouterLink>
          <RouterLink to="/register/driver" class="btn-secondary px-8 py-3 text-base">Driver? Register Here</RouterLink>
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
        <p class="text-sm">© 2026 FleetCheck Pro. All rights reserved.</p>
        <LanguageSelector :compact="true" />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Truck, CheckCircle, ArrowRight, Star, Wrench, ClipboardCheck, BarChart3, Camera, Shield } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()

const checkItems = ['Free 14-day trial', 'No credit card required', 'Works on any device']
const barData = [60, 80, 55, 90, 70, 100, 85]
const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const miniStats = [
  { label: 'Active Vehicles', value: '48', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
  { label: 'Inspections', value: '127', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  { label: 'Open Repairs', value: '6', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
]
const recentRows = [
  { unit: 'Unit #1042', driver: 'J. Smith', status: 'Passed' },
  { unit: 'Unit #0781', driver: 'M. Garcia', status: 'Failed' },
  { unit: 'Unit #2210', driver: 'D. Lee', status: 'Passed' },
]
const stats = [
  { value: '10,000+', label: 'Inspections Daily' },
  { value: '500+', label: 'Companies' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50+', label: 'Countries' },
]
const features = [
  { icon: ClipboardCheck, title: 'Digital Inspections', desc: 'Pre-trip and post-trip checklists with photo capture and digital signatures.' },
  { icon: Truck, title: 'Fleet Management', desc: 'Track all vehicles, equipment, and assets in one centralized dashboard.' },
  { icon: Shield, title: 'Compliance Ready', desc: 'DOT-compliant reports, driver logs, and exportable documentation.' },
  { icon: Camera, title: 'Photo Evidence', desc: 'Capture and store vehicle condition photos with duplicate detection.' },
  { icon: Wrench, title: 'Repair Tracking', desc: 'Log issues, assign mechanics, and track repairs to completion.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Actionable insights on fleet health, driver performance, and trends.' },
]
</script>
