<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft :size="18" />
          <span class="text-sm font-medium">{{ store.t('back') }}</span>
        </RouterLink>
        <div class="flex items-center gap-2">
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div class="text-center mb-10">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Select your business type</h1>
        <p class="text-gray-500 dark:text-gray-400">We'll customize your inspection templates and settings based on your industry.</p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink
          v-for="dept in departments"
          :key="dept.id"
          to="/register/company"
          class="group text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          :class="dept.color"
        >
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" :class="dept.iconBg">
            <component :is="dept.icon" :size="24" :class="dept.iconColor" />
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ dept.label }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ dept.desc }}</p>
        </RouterLink>
      </div>

      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ store.t('alreadyHaveAccount') }}
          <RouterLink to="/login" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">{{ store.t('signIn') }}</RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Truck, HardHat, ArrowUpCircle, Package, Car, Wrench, Grid2x2 as Grid2X2 } from 'lucide-vue-next'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const departments = computed(() => [
  { id: 'trucking',     icon: Truck,        label: store.t('truckingCompany'),       desc: store.t('truckingCompanyDesc'),       color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',       iconColor: 'text-blue-600 dark:text-blue-400',    iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  { id: 'construction', icon: HardHat,      label: store.t('constructionEquipment'), desc: store.t('constructionEquipmentDesc'), color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40' },
  { id: 'boomlift',     icon: ArrowUpCircle,label: store.t('boomLiftRental'),        desc: store.t('boomLiftRentalDesc'),        color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', iconColor: 'text-yellow-600 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
  { id: 'delivery',     icon: Package,      label: store.t('deliveryFleet'),         desc: store.t('deliveryFleetDesc'),         color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',   iconColor: 'text-green-600 dark:text-green-400',  iconBg: 'bg-green-100 dark:bg-green-900/40' },
  { id: 'taxi',         icon: Car,          label: store.t('taxiPassenger'),         desc: store.t('taxiPassengerDesc'),         color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',           iconColor: 'text-sky-600 dark:text-sky-400',      iconBg: 'bg-sky-100 dark:bg-sky-900/40' },
  { id: 'service',      icon: Wrench,       label: store.t('serviceVehicles'),       desc: store.t('serviceVehiclesDesc'),       color: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',   iconColor: 'text-slate-600 dark:text-slate-400',  iconBg: 'bg-slate-100 dark:bg-slate-700' },
  { id: 'other',        icon: Grid2X2,      label: store.t('otherFleet'),            desc: store.t('otherFleetDesc'),            color: 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700',       iconColor: 'text-gray-600 dark:text-gray-400',    iconBg: 'bg-gray-100 dark:bg-gray-700' },
])
</script>
