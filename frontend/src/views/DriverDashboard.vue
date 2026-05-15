<template>
  <AppLayout title="Dashboard">
    <!-- Stats grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div v-for="s in statsCards" :key="s.label" class="stat-card" :class="s.alert ? 'ring-1 ring-red-200 dark:ring-red-800' : ''">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="s.iconBg">
          <component :is="s.icon" :size="20" :class="s.iconColor" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ s.value }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Inspection actions -->
    <div class="card p-5 mb-6">
      <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">{{ store.t('startInspection') }}</h3>
      <div class="grid sm:grid-cols-2 gap-3">
        <RouterLink to="/inspect/pre" class="flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm shadow-blue-500/20 transition-all">
          <div class="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardCheck :size="22" />
          </div>
          <div class="text-left flex-1">
            <p class="font-semibold">{{ store.t('preTripInspection') }}</p>
            <p class="text-blue-200 text-xs">{{ store.t('completedBeforeDeparting') }}</p>
          </div>
          <ChevronRight :size="18" class="text-blue-300" />
        </RouterLink>

        <RouterLink to="/inspect/post" class="flex items-center gap-4 p-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl shadow-sm shadow-green-500/20 transition-all">
          <div class="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardCheck :size="22" />
          </div>
          <div class="text-left flex-1">
            <p class="font-semibold">{{ store.t('postTripInspection') }}</p>
            <p class="text-green-200 text-xs">{{ store.t('completedAfterArriving') }}</p>
          </div>
          <ChevronRight :size="18" class="text-green-300" />
        </RouterLink>
      </div>
    </div>

    <!-- Available vehicles table -->
    <div class="card mb-6">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('availableVehicles') }}</h3>
        <RouterLink to="/driver/vehicles" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in vehicleHeaders" :key="h"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in availableVehicles" :key="v.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img :src="v.img" alt="" class="w-full h-full object-cover" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ v.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">#{{ v.unit }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ v.plate }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ v.type }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ v.odometer }}</td>
              <td class="px-4 py-3"><span class="badge-green">{{ store.t('statusActive') }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent reports table -->
    <div class="card mb-6">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('recentReports') }}</h3>
        <RouterLink to="/driver/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in reportsHeaders" :key="h"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentInspections" :key="r.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Truck :size="13" class="text-gray-400" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ r.unit }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.type }}</td>
              <td class="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">{{ r.date }}</td>
              <td class="px-5 py-3">
                <span :class="r.status === 'pass' ? 'badge-green' : 'badge-red'">{{ r.status === 'pass' ? store.t('statusPassed') : store.t('statusFailed') }}</span>
              </td>
              <td class="px-5 py-3">
                <span v-if="r.issues > 0" class="badge-red">{{ r.issues }}</span>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClipboardCheck, AlertTriangle, ChevronRight, Gauge, Truck } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
const store = useAppStore()

const statsCards = computed(() => [
  { label: store.t('tripsThisMonth'),   value: '18',  icon: Truck,          iconColor: 'text-blue-600 dark:text-blue-400',   iconBg: 'bg-blue-100 dark:bg-blue-900/40',   alert: false },
  { label: store.t('inspectionsPassed'), value: '34',  icon: ClipboardCheck, iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40', alert: false },
  { label: store.t('openIssues'),        value: '1',   icon: AlertTriangle,  iconColor: 'text-red-600 dark:text-red-400',     iconBg: 'bg-red-100 dark:bg-red-900/40',     alert: true  },
  { label: store.t('fuelEfficiency'),    value: '7.2 mpg', icon: Gauge,      iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', alert: false },
])

const vehicleHeaders = computed(() => [store.t('vehicle'), store.t('unit'), store.t('plate'), store.t('type'), store.t('odometer'), store.t('status')])

const reportsHeaders = computed(() => [store.t('vehicle'), store.t('type'), store.t('date'), store.t('result'), store.t('issues')])

const availableVehicles = [
  { id: 1, name: 'Kenworth T680',       unit: '1042', plate: 'ABC-1234', type: 'Truck',  odometer: '84,200 mi',  img: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=200' },
  { id: 2, name: 'Freightliner Cascadia', unit: '2210', plate: 'DEF-9012', type: 'Truck', odometer: '47,800 mi', img: 'https://images.pexels.com/photos/5025642/pexels-photo-5025642.jpeg?w=200' },
  { id: 3, name: 'Ford F-350',          unit: '3305', plate: 'JKL-7890', type: 'Pickup', odometer: '12,300 mi', img: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=200' },
]

const recentInspections = [
  { id: 1, unit: 'Unit #1042', type: 'Pre-Trip',  date: 'Today 7:24 AM',     status: 'pass', issues: 0 },
  { id: 2, unit: 'Unit #1042', type: 'Post-Trip', date: 'Yesterday 6:15 PM', status: 'pass', issues: 0 },
  { id: 3, unit: 'Unit #2210', type: 'Pre-Trip',  date: 'Yesterday 7:02 AM', status: 'fail', issues: 1 },
  { id: 4, unit: 'Unit #1042', type: 'Post-Trip', date: 'May 10, 6:45 PM',   status: 'pass', issues: 0 },
  { id: 5, unit: 'Unit #1042', type: 'Pre-Trip',  date: 'May 10, 7:15 AM',   status: 'pass', issues: 0 },
]
</script>
