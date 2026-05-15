<template>
  <AppLayout title="Dashboard">
    <!-- Stats grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
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

    <!-- Charts row -->
    <div class="grid lg:grid-cols-3 gap-4 mb-6">
      <!-- Weekly bar chart -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('inspectionsThisWeek') }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total: 638 inspections</p>
          </div>
          <div class="flex items-center gap-1 text-green-500 text-xs font-medium">
            <TrendingUp :size="14" /> +12%
          </div>
        </div>
        <div class="flex items-end gap-2 h-28">
          <div v-for="(v, i) in weekData" :key="i" class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[10px] text-gray-400">{{ v }}</span>
            <div class="w-full rounded-t-md bg-blue-100 dark:bg-blue-900/30 relative" style="height:80px">
              <div class="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-400 rounded-t-md" :style="{ height: `${(v / maxWeek) * 100}%` }" />
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-2">
          <span v-for="d in weekDays" :key="d" class="flex-1 text-center text-[10px] text-gray-400">{{ d }}</span>
        </div>
      </div>

      <!-- Issue categories -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">{{ store.t('issuesByCategory') }}</h3>
        <div class="space-y-3">
          <div v-for="c in issueCategories" :key="c.label">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-gray-600 dark:text-gray-400 font-medium">{{ c.label }}</span>
              <span class="text-gray-900 dark:text-white font-semibold">{{ c.count }}</span>
            </div>
            <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div class="h-full rounded-full" :class="c.color" :style="{ width: `${c.pct}%` }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Inspections pending review -->
    <div class="card mb-6">
      <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('inspectionsPendingReview') }}</h3>
        <RouterLink to="/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th v-for="h in pendingHeaders" :key="h" class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in pendingInspections" :key="r.unit" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Truck :size="13" class="text-gray-400" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ r.unit }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{{ r.driver }}</td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{{ r.type }}</td>
              <td class="px-5 py-3"><span :class="r.status === 'pass' ? 'badge-green' : 'badge-red'">{{ r.status === 'pass' ? store.t('statusPassed') : store.t('statusFailed') }}</span></td>
              <td class="px-5 py-3 text-sm text-gray-400">{{ r.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Repair status -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('repairStatus') }}</h3>
        <RouterLink to="/repairs" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
      </div>
      <div class="flex gap-2 mb-4 h-4 rounded-full overflow-hidden">
        <div v-for="r in repairStatus" :key="r.label" class="h-full" :class="r.color" :style="{ width: `${r.pct}%` }" />
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div v-for="r in repairStatus" :key="r.label" class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full" :class="r.color" />
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ r.label }}</span>
          <span class="ml-auto text-xs font-semibold text-gray-900 dark:text-white">{{ r.count }}</span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import { Truck, ClipboardCheck, Users, Clock, AlertTriangle, Wrench, XCircle, TrendingUp, ChevronRight } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'

const store = useAppStore()

const weekData = [72, 89, 64, 98, 76, 112, 127]
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const maxWeek = computed(() => Math.max(...weekData))

const statsCards = computed(() => [
  { label: store.t('vehicles'), value: '48', icon: Truck, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40', alert: false },
  { label: store.t('drivers'), value: '36', icon: Users, iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40', alert: false },
  { label: store.t('statusPending'), value: '4', icon: Clock, iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', alert: true },
  { label: store.t('inspections'), value: '127', icon: ClipboardCheck, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40', alert: false },
  { label: store.t('statusFailed'), value: '8', icon: AlertTriangle, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/40', alert: true },
  { label: store.t('repairs'), value: '12', icon: Wrench, iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', alert: true },
  { label: store.t('outOfService'), value: '3', icon: XCircle, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/40', alert: true },
])

const issueCategories = computed(() => [
  { label: store.t('tires'), count: 18, pct: 72, color: 'bg-orange-400' },
  { label: store.t('lights'), count: 12, pct: 48, color: 'bg-yellow-400' },
  { label: store.t('brakes'), count: 9, pct: 36, color: 'bg-red-400' },
  { label: store.t('fluidLevels'), count: 7, pct: 28, color: 'bg-blue-400' },
  { label: store.t('exterior'), count: 4, pct: 16, color: 'bg-gray-400' },
])

const repairStatus = computed(() => [
  { label: store.t('statusOpen'), count: 12, color: 'bg-red-500', pct: 40 },
  { label: store.t('statusInProgress'), count: 7, color: 'bg-orange-500', pct: 23 },
  { label: store.t('statusPending'), count: 5, color: 'bg-yellow-500', pct: 17 },
  { label: store.t('statusCompleted'), count: 6, color: 'bg-green-500', pct: 20 },
])

const pendingHeaders = computed(() => [store.t('vehicle'), store.t('driver'), store.t('type'), store.t('status'), store.t('time')])

const pendingInspections = [
  { unit: 'Unit #0781', driver: 'Maria Garcia', type: 'Pre-Trip', status: 'fail', time: '7:18 AM' },
  { unit: 'Unit #1099', driver: 'Mike Brown', type: 'Post-Trip', status: 'fail', time: '6:31 AM' },
  { unit: 'Unit #1042', driver: 'James Smith', type: 'Pre-Trip', status: 'pass', time: '7:24 AM' },
  { unit: 'Unit #3305', driver: 'Sarah Johnson', type: 'Pre-Trip', status: 'pass', time: '6:42 AM' },
  { unit: 'Unit #2210', driver: 'David Lee', type: 'Post-Trip', status: 'pass', time: '6:55 AM' },
]
</script>
