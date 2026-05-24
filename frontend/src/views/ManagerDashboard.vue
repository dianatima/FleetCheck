<template>
  <AppLayout :title="store.t('dashboard')">
    <div v-if="dashboardError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {{ dashboardError }}
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      <button
        v-for="s in statsCards"
        :key="s.label"
        type="button"
        class="stat-card text-left transition-all hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 dark:hover:ring-offset-gray-950"
        :class="s.alert ? 'ring-1 ring-red-200 dark:ring-red-800' : ''"
        @click="openStatCard(s.to)"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="s.iconBg">
          <component :is="s.icon" :size="20" :class="s.iconColor" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ s.value }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ s.label }}</p>
        </div>
      </button>
    </div>

    <!-- Charts row -->
    <div class="grid lg:grid-cols-3 gap-4 mb-6">
      <!-- Weekly bar chart -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('inspectionsThisWeek') }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentWeekTotal }} {{ store.t('inspections') }}</p>
          </div>
          <div class="flex items-center gap-1 text-xs font-medium" :class="weekTrendClass">
            <TrendingUp :size="14" /> {{ weekTrendLabel }}
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
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('issuesByCategory') }}</h3>
          <RouterLink to="/issues" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
        </div>
        <div v-if="issueCategories.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
          {{ store.t('noIssuesFound') }}
        </div>
        <div v-else class="space-y-3">
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
            <tr v-if="dashboardLoading">
              <td :colspan="pendingHeaders.length" class="px-5 py-8 text-center text-sm text-gray-400">{{ store.t('loadingDashboard') }}</td>
            </tr>
            <tr v-else-if="pendingInspections.length === 0">
              <td :colspan="pendingHeaders.length" class="px-5 py-8 text-center text-sm text-gray-400">{{ store.t('noReportsFound') }}</td>
            </tr>
            <tr v-for="r in pendingInspections" :key="r.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Truck :size="13" class="text-gray-400" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ r.vehicle }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{{ r.driver }}</td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400">{{ r.type }}</td>
              <td class="px-5 py-3"><span :class="r.result === 'pass' ? 'badge-green' : 'badge-red'">{{ r.result === 'pass' ? store.t('statusPassed') : store.t('statusFailed') }}</span></td>
              <td class="px-5 py-3 text-sm text-gray-400">{{ r.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fleet status -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('status') }}</h3>
        <RouterLink to="/vehicles" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
      </div>
      <div class="flex gap-2 mb-4 h-4 rounded-full overflow-hidden">
        <div v-for="r in fleetStatus" :key="r.label" class="h-full" :class="r.color" :style="{ width: `${r.pct}%` }" />
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="r in fleetStatus"
          :key="r.key"
          type="button"
          class="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/80"
          @click="openFleetStatus(r.key)"
        >
          <div class="w-2.5 h-2.5 rounded-full" :class="r.color" />
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ r.label }}</span>
          <span class="ml-auto text-xs font-semibold text-gray-900 dark:text-white">{{ r.count }}</span>
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { useAppStore } from '../stores/app'
import { Truck, ClipboardCheck, Users, Clock, AlertTriangle, Wrench, XCircle, TrendingUp, ChevronRight } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/authStore'
import { fetchManagerDashboardData, type ManagerDashboardData } from '@/lib/managerDashboard'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const localeMap: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  es: 'es-ES',
  fr: 'fr-FR',
}

const dashboardData = ref<ManagerDashboardData | null>(null)
const dashboardLoading = ref(false)
const dashboardError = ref('')

const weekData = computed(() => dashboardData.value?.weekBuckets.map((bucket) => bucket.count) || [0, 0, 0, 0, 0, 0, 0])
const weekDays = computed(() => dashboardData.value?.weekBuckets.map((bucket) => bucket.label) || ['-', '-', '-', '-', '-', '-', '-'])
const maxWeek = computed(() => Math.max(1, ...weekData.value))
const currentWeekTotal = computed(() => dashboardData.value?.currentWeekTotal || 0)
const weekTrendLabel = computed(() => {
  const trendPercent = dashboardData.value?.weekTrendPercent || 0

  if (trendPercent > 0) {
    return `+${trendPercent}%`
  }

  if (trendPercent < 0) {
    return `${trendPercent}%`
  }

  return '0%'
})
const weekTrendClass = computed(() => {
  const direction = dashboardData.value?.weekTrendDirection || 'flat'

  if (direction === 'up') {
    return 'text-green-500'
  }

  if (direction === 'down') {
    return 'text-red-500'
  }

  return 'text-gray-400'
})

const statsCards = computed(() => [
  { label: store.t('vehicles'), value: dashboardData.value?.vehicleCount ?? 0, icon: Truck, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40', alert: false, to: '/vehicles' as RouteLocationRaw },
  { label: store.t('drivers'), value: dashboardData.value?.driverCount ?? 0, icon: Users, iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40', alert: false, to: '/drivers' as RouteLocationRaw },
  { label: store.t('statusNeedsReview'), value: dashboardData.value?.needsReviewCount ?? 0, icon: Clock, iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', alert: (dashboardData.value?.needsReviewCount ?? 0) > 0, to: { path: '/reports', query: { result: 'needs-review' } } as RouteLocationRaw },
  { label: store.t('inspections'), value: dashboardData.value?.inspectionCount ?? 0, icon: ClipboardCheck, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/40', alert: false, to: '/reports' as RouteLocationRaw },
  { label: store.t('statusFailed'), value: dashboardData.value?.failedInspectionCount ?? 0, icon: AlertTriangle, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/40', alert: (dashboardData.value?.failedInspectionCount ?? 0) > 0, to: { path: '/reports', query: { result: 'fail' } } as RouteLocationRaw },
  { label: store.t('statusInRepair'), value: dashboardData.value?.inRepairVehicleCount ?? 0, icon: Wrench, iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', alert: (dashboardData.value?.inRepairVehicleCount ?? 0) > 0, to: { path: '/vehicles', query: { status: 'in-repair' } } as RouteLocationRaw },
  { label: store.t('outOfService'), value: dashboardData.value?.blockedVehicleCount ?? 0, icon: XCircle, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/40', alert: (dashboardData.value?.blockedVehicleCount ?? 0) > 0, to: { path: '/vehicles', query: { status: 'blocked' } } as RouteLocationRaw },
])

const issueCategories = computed(() => dashboardData.value?.issueCategories || [])
const fleetStatus = computed(() => {
  const items = dashboardData.value?.fleetStatus || []

  return items.map((item) => ({
    ...item,
    key: item.label,
    label: item.label === 'active'
      ? store.t('statusActive')
      : item.label === 'needs-attention'
        ? store.t('statusNeedsAttention')
        : item.label === 'blocked'
          ? store.t('statusBlocked')
          : store.t('statusInRepair'),
  }))
})

const pendingHeaders = computed(() => [store.t('vehicle'), store.t('driver'), store.t('type'), store.t('status'), store.t('time')])
const pendingInspections = computed(() => dashboardData.value?.pendingInspections || [])

function openStatCard(target: RouteLocationRaw) {
  void router.push(target)
}

function openFleetStatus(status: string) {
  void router.push({ path: '/vehicles', query: { status } })
}

async function loadDashboard(companyId = authStore.companyId, language = store.language) {
  dashboardError.value = ''

  if (!companyId) {
    dashboardData.value = null
    return
  }

  dashboardLoading.value = true

  try {
    dashboardData.value = await fetchManagerDashboardData(companyId, localeMap[language] || 'en-US')
  } catch (loadError: any) {
    dashboardError.value = loadError?.message || store.t('unableToLoadDashboard')
    dashboardData.value = null
  } finally {
    dashboardLoading.value = false
  }
}

watch(
  [() => authStore.companyId, () => store.language],
  ([companyId, language]) => {
    void loadDashboard(companyId, language)
  },
  { immediate: true },
)
</script>
