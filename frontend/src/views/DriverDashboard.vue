<template>
  <AppLayout title="Dashboard">
    <div v-if="loading || vehicleStore.loading" class="card p-6 text-sm text-gray-500 dark:text-gray-400">
      Loading dashboard...
    </div>
    <div v-else-if="error || vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ error || vehicleStore.error }}
    </div>
    <template v-else>
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div
          v-for="stat in statsCards"
          :key="stat.label"
          class="stat-card"
          :class="stat.alert ? 'ring-1 ring-orange-200 dark:ring-orange-800' : ''"
        >
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="stat.iconBg">
            <component :is="stat.icon" :size="20" :class="stat.iconColor" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <div class="card p-5 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-medium text-gray-700 dark:text-gray-200 text-sm">{{ store.t('inspectionsThisWeek') }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total: {{ weekTotal }} inspections</p>
            </div>
            <div class="flex items-center gap-1 text-green-500 text-xs font-medium">
              <TrendingUp :size="14" /> {{ weekTrendLabel }}
            </div>
          </div>
          <div class="flex items-end gap-2 h-28">
            <div v-for="(value, index) in weekData" :key="weekDays[index]" class="flex-1 flex flex-col items-center gap-1">
              <span class="text-[10px] text-gray-400">{{ value }}</span>
              <div class="w-full rounded-t-md bg-blue-100 dark:bg-blue-900/30 relative" style="height:80px">
                <div
                  class="absolute bottom-0 left-0 right-0 bg-blue-500 dark:bg-blue-400 rounded-t-md"
                  :style="{ height: `${(value / maxWeek) * 100}%` }"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-2">
            <span v-for="day in weekDays" :key="day" class="flex-1 min-w-0 text-center text-[10px] text-gray-400 truncate">{{ day }}</span>
          </div>
      </div>

      <section class="card mb-6">
        <div class="flex items-center justify-between p-5 border-b border-gray-100/80 dark:border-gray-800">
          <h2 class="font-medium text-gray-700 dark:text-gray-200 text-sm">Available Vehicles</h2>
          <RouterLink to="/driver/vehicles" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
            {{ store.t('viewAll') }} <ChevronRight :size="12" />
          </RouterLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="table-header-row">
                <th v-for="header in vehicleHeaders" :key="header" class="table-th">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="availableVehicles.length === 0">
                <td :colspan="vehicleHeaders.length" class="px-5 py-10 text-center text-sm text-gray-400">
                  No active vehicles are available for inspection right now.
                </td>
              </tr>
              <tr
                v-for="vehicle in availableVehicles"
                :key="vehicle.id"
                class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors cursor-pointer"
                @click="router.push(`/driver/vehicles/${vehicle.id}`)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img v-if="vehicle.photo_url" :src="vehicle.photo_url" alt="" class="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {{ vehicleName(vehicle) }}
                      </p>
                      <p class="text-xs font-mono text-gray-400">{{ vehicle.unit || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="table-td">{{ vehicle.vehicle_types?.name || '—' }}</td>
                <td class="table-td">{{ vehicle.plate || '—' }}</td>
                <td class="table-td">{{ vehicle.odometer != null ? `${Number(vehicle.odometer).toLocaleString()} mi` : '—' }}</td>
                <td class="px-4 py-3">
                  <span :class="availabilityBadge(vehicle)">
                    {{ availabilityLabel(vehicle) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <RouterLink :to="`/driver/vehicles/${vehicle.id}`" class="icon-btn" title="View vehicle" @click.stop>
                      <Eye :size="15" />
                    </RouterLink>
                    <button
                      class="btn-primary px-2 py-1.5 text-xs whitespace-nowrap"
                      :disabled="!canStartPreTrip(vehicle) || startingVehicleId === vehicle.id"
                      @click.stop="startPreTrip(vehicle)"
                    >
                      Pre-trip
                    </button>
                    <button
                      class="btn-secondary px-2 py-1.5 text-xs whitespace-nowrap"
                      :disabled="!canStartPostTrip(vehicle) || startingVehicleId === vehicle.id"
                      @click.stop="startPostTrip(vehicle)"
                    >
                      Post-trip
                    </button>
                  </div>
                  <p v-if="vehicle.awaiting_manager_review" class="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
                    Manager review required before post-trip.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="grid gap-6">
        <section class="card">
          <div class="flex items-center justify-between p-5 border-b border-gray-100/80 dark:border-gray-800">
            <h2 class="font-medium text-gray-700 dark:text-gray-200 text-sm">Recent Reports</h2>
            <RouterLink
              to="/driver/reports"
              class="flex items-center gap-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {{ store.t('viewAll') }} <ChevronRight :size="12" />
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="table-header-row">
                  <th v-for="header in reportHeaders" :key="header" class="table-th">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="recentReports.length === 0">
                  <td :colspan="reportHeaders.length" class="px-5 py-10 text-center text-sm text-gray-400">
                    No submitted reports yet.
                  </td>
                </tr>
                <tr
                  v-for="report in recentReports"
                  :key="report.id"
                  class="cursor-pointer border-b border-gray-100/70 transition-colors hover:bg-gray-50/70 dark:border-gray-800/70 dark:hover:bg-gray-800/45"
                  @click="openInspectionModal(report.id)"
                >
                  <td class="px-4 py-3">
                    <div class="flex min-w-56 items-center gap-3">
                      <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        <img
                          v-if="relation(report.vehicles)?.photo_url"
                          :src="relation(report.vehicles)?.photo_url"
                          alt=""
                          class="h-full w-full object-cover"
                        />
                        <Truck v-else :size="15" class="text-gray-400" />
                      </div>
                      <div>
                        <p class="whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {{ vehicleName(relation(report.vehicles)) }}
                        </p>
                        <p class="text-xs font-mono text-gray-400">
                          {{ vehicleSubtitle(relation(report.vehicles)) }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="table-td">{{ typeLabel(report.type) }}</td>
                  <td class="px-5 py-3">
                    <span :class="reportResultBadge(report)">{{ reportResultLabel(report) }}</span>
                  </td>
                  <td class="table-td">{{ formatDate(report.submitted_at || report.created_at) }}</td>
                  <td class="px-5 py-3" @click.stop>
                    <button
                      type="button"
                      class="icon-btn"
                      title="Open Report"
                      @click.stop="openInspectionModal(report.id)"
                    >
                      <FileText :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <InspectionReportModal
        v-model="inspectionModalOpen"
        :inspection-id="selectedInspectionId"
      />
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  Car,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  TrendingUp,
  Truck,
} from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import InspectionReportModal from '@/components/shared/InspectionReportModal.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { useDriverVehicleStore } from '@/stores/driverVehicleStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'

const router = useRouter()
const store = useAppStore()
const authStore = useAuthStore()
const vehicleStore = useDriverVehicleStore()
const loading = ref(false)
const error = ref<string | null>(null)
const currentDriver = ref<any | null>(null)
const recentReports = ref<any[]>([])
const analyticsReports = ref<any[]>([])
const reportsSubmittedCount = ref(0)
const failedReportsCount = ref(0)
const startingVehicleId = ref('')
const inspectionModalOpen = ref(false)
const selectedInspectionId = ref<string | null>(null)

onMounted(fetchDashboard)

watch(
  () => [authStore.profile?.id, authStore.profile?.status],
  () => fetchDashboard()
)

async function fetchDashboard() {
  if (!authStore.profile?.id || authStore.profile?.status !== 'active') return

  loading.value = true
  error.value = null

  const driver = await vehicleStore.fetchDriverContext()
  if (!driver) {
    loading.value = false
    return
  }

  currentDriver.value = driver
  await vehicleStore.fetchDriverVehicles()

  const [
    reportsResult,
    analyticsReportsResult,
    reportsSubmittedResult,
    failedReportsResult,
  ] = await Promise.all([
    supabase
      .from('inspections')
      .select(`
        id,
        vehicle_id,
        type,
        status,
        created_at,
        submitted_at,
        vehicles (
          unit,
          make,
          model,
          plate,
          photo_url
        ),
        inspection_results (
          id,
          result
        )
      `)
      .eq('driver_id', driver.id)
      .eq('company_id', driver.company_id)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('inspections')
      .select(`
        id,
        type,
        status,
        created_at,
        submitted_at,
        inspection_results (
          id,
          result
        )
      `)
      .eq('driver_id', driver.id)
      .eq('company_id', driver.company_id)
      .neq('status', 'draft')
      .gte('created_at', analyticsStartDate().toISOString())
      .order('created_at', { ascending: true })
      .limit(1000),
    supabase
      .from('inspections')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', driver.id)
      .eq('company_id', driver.company_id)
      .neq('status', 'draft'),
    supabase
      .from('inspections')
      .select('id, inspection_results!inner(result)', { count: 'exact', head: true })
      .eq('driver_id', driver.id)
      .eq('company_id', driver.company_id)
      .neq('status', 'draft')
      .eq('inspection_results.result', 'fail'),
  ])

  const firstError =
    reportsResult.error ||
    analyticsReportsResult.error ||
    reportsSubmittedResult.error ||
    failedReportsResult.error

  if (firstError) {
    error.value = firstError.message
    loading.value = false
    return
  }

  recentReports.value = reportsResult.data || []
  analyticsReports.value = analyticsReportsResult.data || []
  reportsSubmittedCount.value = reportsSubmittedResult.count || 0
  failedReportsCount.value = failedReportsResult.count || 0
  loading.value = false
}

const availableVehicles = computed(() => vehicleStore.inspectableVehicles)

const weekBuckets = computed(() => {
  const days = buildCurrentWeekDays()
  const byKey = new Map(days.map((day) => [day.key, { ...day, total: 0 }]))

  for (const report of analyticsReports.value) {
    const key = dayKey(report.submitted_at || report.created_at)
    const day = byKey.get(key)
    if (day) day.total += 1
  }

  return [...byKey.values()]
})

const weekData = computed(() => weekBuckets.value.map((day) => day.total))
const weekDays = computed(() => weekBuckets.value.map((day) => day.shortLabel))
const maxWeek = computed(() => Math.max(1, ...weekData.value))
const weekTotal = computed(() => weekData.value.reduce((sum, value) => sum + value, 0))
const previousWeekTotal = computed(() => {
  const currentStart = startOfWeekMonday()
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - 7)

  return analyticsReports.value.filter((report) => {
    const time = new Date(report.submitted_at || report.created_at).getTime()
    return time >= previousStart.getTime() && time < currentStart.getTime()
  }).length
})
const weekTrendLabel = computed(() => {
  if (!previousWeekTotal.value && weekTotal.value) return '+100%'
  if (!previousWeekTotal.value) return '0%'
  const change = Math.round(((weekTotal.value - previousWeekTotal.value) / previousWeekTotal.value) * 100)
  return `${change >= 0 ? '+' : ''}${change}%`
})

const statsCards = computed(() => [
  stat('Available Vehicles', availableVehicles.value.length, Car, 'green'),
  stat('Reports Submitted', reportsSubmittedCount.value, ClipboardCheck, 'blue'),
  stat('Failed Reports', failedReportsCount.value, AlertTriangle, 'red', failedReportsCount.value > 0),
])

const vehicleHeaders = ['Vehicle', 'Vehicle type', 'Plate', 'Odometer', 'Availability', 'Actions']
const reportHeaders = ['Vehicle', 'Type', 'Result', 'Date', 'Action']

function stat(label: string, value: number, icon: any, tone: 'blue' | 'green' | 'orange' | 'red', alert = false) {
  return {
    label,
    value,
    icon,
    alert,
    iconBg: {
      blue: 'bg-blue-100 dark:bg-blue-900/40',
      green: 'bg-green-100 dark:bg-green-900/40',
      orange: 'bg-orange-100 dark:bg-orange-900/40',
      red: 'bg-red-100 dark:bg-red-900/40',
    }[tone],
    iconColor: {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      orange: 'text-orange-600 dark:text-orange-400',
      red: 'text-red-600 dark:text-red-400',
    }[tone],
  }
}

function relation(value: any) {
  return Array.isArray(value) ? value[0] : value
}

function relationArray(value: any) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function analyticsStartDate() {
  const start = new Date()
  start.setDate(start.getDate() - 29)
  start.setHours(0, 0, 0, 0)
  return start
}

function buildCurrentWeekDays() {
  const weekStart = startOfWeekMonday()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return {
      key: dayKey(date),
      label: formatDateTime(date.toISOString(), store.language),
      shortLabel: date.toLocaleDateString(dateLocale(), { weekday: 'long' }),
    }
  })
}

function startOfWeekMonday(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const weekday = date.getDay()
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1
  date.setDate(date.getDate() - daysFromMonday)
  return date
}

function dayKey(value: string | Date | null) {
  if (!value) return ''
  const date = new Date(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function dateLocale() {
  return store.language === 'uk'
    ? 'uk-UA'
    : store.language === 'es'
    ? 'es-ES'
    : store.language === 'fr'
    ? 'fr-FR'
    : 'en-US'
}

function vehicleName(vehicle: any) {
  return `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || vehicle?.unit || 'Vehicle'
}

function vehicleSubtitle(vehicle: any) {
  return [vehicle?.unit ? `#${vehicle.unit}` : '', vehicle?.plate || ''].filter(Boolean).join(' · ') || '—'
}

function vehicleLabel(vehicle: any) {
  const row = relation(vehicle)
  const name = `${row?.make || ''} ${row?.model || ''}`.trim()
  return [name, row?.unit ? `#${row.unit}` : '', row?.plate || ''].filter(Boolean).join(' · ') || '—'
}

function availabilityLabel(vehicle: any) {
  return vehicle.assigned_to_me
    ? 'Assigned to you'
    : vehicle.awaiting_manager_review
    ? 'Awaiting manager review'
    : vehicle.locked_by_current_assignment
    ? 'Post-trip required first'
    : vehicle.in_active_repair
    ? 'In repair'
    : vehicle.available
    ? 'Available'
    : 'Unavailable'
}

function availabilityBadge(vehicle: any) {
  return vehicle.assigned_to_me
    ? 'badge-blue'
    : vehicle.awaiting_manager_review
    ? 'badge-yellow'
    : vehicle.in_active_repair
    ? 'badge-orange'
    : vehicle.available
    ? 'badge-green'
    : 'badge-gray'
}

function canStartPreTrip(vehicle: any) {
  return (
    vehicle.status === 'active' &&
    !vehicle.in_active_repair &&
    !vehicle.awaiting_manager_review &&
    !vehicle.assigned_to_other &&
    (Boolean(vehicle.available) || Boolean(vehicle.assigned_to_me))
  )
}

function canStartPostTrip(vehicle: any) {
  return vehicle.status === 'active' && Boolean(vehicle.post_trip_ready)
}

async function startPreTrip(vehicle: any) {
  if (!canStartPreTrip(vehicle)) return
  startingVehicleId.value = vehicle.id
  const inspectionId = await vehicleStore.startPreTripInspection(vehicle.id)
  startingVehicleId.value = ''
  if (inspectionId) router.push(`/inspect/pre?inspectionId=${inspectionId}&vehicleId=${vehicle.id}`)
}

async function startPostTrip(vehicle: any) {
  if (!canStartPostTrip(vehicle)) return
  startingVehicleId.value = vehicle.id
  const inspectionId = await vehicleStore.startPostTripInspection(vehicle.id)
  startingVehicleId.value = ''
  if (inspectionId) router.push(`/inspect/post?inspectionId=${inspectionId}&vehicleId=${vehicle.id}`)
}

function typeLabel(type: string) {
  return type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
}

function reportHasFailure(report: any) {
  return relationArray(report.inspection_results).some((result) => result.result === 'fail')
}

function reportResultLabel(report: any) {
  return reportHasFailure(report) ? store.t('statusFailed') : store.t('statusPassed')
}

function reportResultBadge(report: any) {
  return reportHasFailure(report) ? 'badge-red' : 'badge-green'
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language)
}

async function openInspectionModal(inspectionId: string) {
  selectedInspectionId.value = inspectionId
  inspectionModalOpen.value = true
}
</script>
