<template>
  <AppLayout :title="store.t('driverDashboard')">
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

    <!-- Vehicle workflow -->
    <div class="card p-5 mb-6">
      <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">{{ store.t('startInspection') }}</h3>
      <RouterLink to="/operations/start" class="flex items-center gap-4 rounded-2xl bg-blue-600 p-5 text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 active:bg-blue-800">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 flex-shrink-0">
          <ClipboardCheck :size="24" />
        </div>
        <div class="flex-1 text-left">
          <p class="font-semibold">{{ store.t('chooseVehicleAndAction') }}</p>
          <p class="text-xs text-blue-100">{{ store.t('chooseVehicleAndActionHint') }}</p>
        </div>
        <ChevronRight :size="18" class="text-blue-200" />
      </RouterLink>
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
            <tr v-if="vehiclesLoading">
              <td :colspan="vehicleHeaders.length" class="px-4 py-8 text-center text-sm text-gray-400">{{ store.t('loadingVehicles') }}</td>
            </tr>
            <tr v-else-if="vehiclesError">
              <td :colspan="vehicleHeaders.length" class="px-4 py-8 text-center text-sm text-red-500">{{ vehiclesError }}</td>
            </tr>
            <tr v-else-if="visibleVehicles.length === 0">
              <td :colspan="vehicleHeaders.length" class="px-4 py-8 text-center text-sm text-gray-400">{{ store.t('noVehiclesFound') }}</td>
            </tr>
            <tr v-for="v in visibleVehicles" :key="v.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-3 cursor-pointer" @click="openVehicle(v.id)">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img v-if="v.photo_url" :src="v.photo_url" alt="" class="w-full h-full object-cover" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ getVehicleName(v) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="openVehicle(v.id)">#{{ v.unit }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="openVehicle(v.id)">{{ v.plate }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" @click="openVehicle(v.id)">{{ getVehicleTypeLabel(v.type, store.language) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="openVehicle(v.id)">{{ formatOdometer(v) }}</td>
              <td class="px-4 py-3 cursor-pointer" @click="openVehicle(v.id)"><span :class="vehicleStatusConfig[v.status]?.badge || 'badge-gray'">{{ vehicleStatusConfig[v.status]?.label || v.status }}</span></td>
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
            <tr v-if="reportsLoading">
              <td :colspan="reportsHeaders.length" class="px-5 py-8 text-center text-sm text-gray-400">{{ store.t('loadingReports') }}</td>
            </tr>
            <tr v-else-if="reportsError">
              <td :colspan="reportsHeaders.length" class="px-5 py-8 text-center text-sm text-red-500">{{ reportsError }}</td>
            </tr>
            <tr v-else-if="recentInspections.length === 0">
              <td :colspan="reportsHeaders.length" class="px-5 py-8 text-center text-sm text-gray-400">{{ store.t('noReportsFound') }}</td>
            </tr>
            <tr v-for="r in recentInspections" :key="r.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Truck :size="13" class="text-gray-400" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ r.vehicle }}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.type }}</td>
              <td class="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.performedBy }}</td>
              <td class="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">{{ r.date }}</td>
              <td class="px-5 py-3">
                <span :class="r.result === 'pass' ? 'badge-green' : 'badge-red'">{{ r.result === 'pass' ? store.t('statusPassed') : store.t('statusFailed') }}</span>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardCheck, AlertTriangle, ChevronRight, Gauge, Truck } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchCompanyVehicles, type CompanyVehicle } from '@/lib/companyVehicles'
import { fetchInspectionReports, type InspectionReportRecord } from '@/lib/inspectionReports'
import { getVehicleTypeLabel } from '@/lib/vehicleCatalog'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const statsCards = computed(() => [
  { label: store.t('tripsThisMonth'),   value: '18',  icon: Truck,          iconColor: 'text-blue-600 dark:text-blue-400',   iconBg: 'bg-blue-100 dark:bg-blue-900/40',   alert: false },
  { label: store.t('inspectionsPassed'), value: '34',  icon: ClipboardCheck, iconColor: 'text-green-600 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/40', alert: false },
  { label: store.t('openIssues'),        value: '1',   icon: AlertTriangle,  iconColor: 'text-red-600 dark:text-red-400',     iconBg: 'bg-red-100 dark:bg-red-900/40',     alert: true  },
  { label: store.t('fuelEfficiency'),    value: '7.2 mpg', icon: Gauge,      iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', alert: false },
])

const vehicleHeaders = computed(() => [store.t('vehicle'), store.t('unit'), store.t('plate'), store.t('type'), store.t('odometer'), store.t('status')])

const reportsHeaders = computed(() => [store.t('vehicle'), store.t('type'), store.t('reportedBy'), store.t('date'), store.t('result'), store.t('issues')])

const availableVehicles = ref<CompanyVehicle[]>([])
const vehiclesLoading = ref(false)
const vehiclesError = ref('')
const recentInspections = ref<InspectionReportRecord[]>([])
const reportsLoading = ref(false)
const reportsError = ref('')

const visibleVehicles = computed(() => availableVehicles.value.slice(0, 3))

const vehicleStatusConfig = computed<Record<string, { label: string; badge: string }>>(() => ({
  active: { label: store.t('statusActive'), badge: 'badge-green' },
  'needs-attention': { label: store.t('statusNeedsAttention'), badge: 'badge-orange' },
  blocked: { label: store.t('statusBlocked'), badge: 'badge-red' },
  'in-repair': { label: store.t('statusInRepair'), badge: 'badge-gray' },
}))

function getVehicleName(vehicle: CompanyVehicle) {
  return `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.unit
}

function formatOdometer(vehicle: CompanyVehicle) {
  return vehicle.odometer != null ? `${Number(vehicle.odometer).toLocaleString()} mi` : '—'
}

function openVehicle(vehicleId: string) {
  void router.push(`/vehicles/${vehicleId}`)
}

async function loadAvailableVehicles() {
  vehiclesError.value = ''

  if (!authStore.companyId) {
    availableVehicles.value = []
    return
  }

  vehiclesLoading.value = true

  try {
    availableVehicles.value = await fetchCompanyVehicles(authStore.companyId, {
      assignedToAuthUserId: authStore.user?.id || null,
    })
  } catch (loadError: any) {
    vehiclesError.value = loadError?.message || store.t('unableToLoadVehicles')
    availableVehicles.value = []
  } finally {
    vehiclesLoading.value = false
  }
}

async function loadRecentInspections() {
  reportsError.value = ''

  if (!authStore.companyId) {
    recentInspections.value = []
    return
  }

  reportsLoading.value = true

  try {
    recentInspections.value = await fetchInspectionReports(authStore.companyId, {
      driverAuthUserId: authStore.user?.id || null,
      limit: 5,
    })
  } catch (loadError: any) {
    reportsError.value = loadError?.message || store.t('unableToLoadReports')
    recentInspections.value = []
  } finally {
    reportsLoading.value = false
  }
}

onMounted(loadAvailableVehicles)
onMounted(loadRecentInspections)

watch(() => authStore.companyId, loadAvailableVehicles)
watch(() => authStore.companyId, loadRecentInspections)
</script>
