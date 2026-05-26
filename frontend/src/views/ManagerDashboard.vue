<template>
  <AppLayout title="Dashboard">
    <div v-if="loading" class="card p-6 text-sm text-gray-500 dark:text-gray-400">
      Loading dashboard...
    </div>
    <div v-else-if="error" class="card p-6 text-sm text-red-500">
      {{ error }}
    </div>
    <template v-else>
      <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
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

      <div class="grid lg:grid-cols-3 gap-4 mb-6">
        <div class="card p-5 lg:col-span-2">
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

        <div class="card p-5">
          <div class="mb-4">
            <h3 class="font-medium text-gray-700 dark:text-gray-200 text-sm">Failures trend</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Failed inspections and unresolved issues</p>
          </div>
          <div class="space-y-4">
            <div v-for="metric in failureTrendRows" :key="metric.label">
              <div class="flex items-center justify-between gap-3 text-xs mb-1.5">
                <span class="text-gray-600 dark:text-gray-400 font-medium">{{ metric.label }}</span>
                <span class="text-gray-900 dark:text-white font-semibold tabular-nums">{{ metric.count }}</span>
              </div>
              <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="metric.color"
                  :style="{ width: `${metric.pct}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4 mb-6 items-stretch">
        <section class="card h-full">
          <div class="flex items-center justify-between p-5 border-b border-gray-100/80 dark:border-gray-800">
            <h2 class="font-medium text-gray-700 dark:text-gray-200 text-sm">Issues Under Review</h2>
            <RouterLink to="/issues" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
              {{ store.t('viewAll') }} <ChevronRight :size="12" />
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="table-header-row">
                  <th v-for="header in issueHeaders" :key="header" class="table-th">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="openIssues.length === 0">
                  <td :colspan="issueHeaders.length" class="px-5 py-10 text-center text-sm text-gray-400">
                    No issues are awaiting review.
                  </td>
                </tr>
                <tr
                  v-for="issue in openIssues"
                  :key="issue.id"
                  class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
                >
                  <td class="px-4 py-3">
                    <VehiclePreviewCell :vehicle="issue.vehicles" />
                  </td>
                  <td class="px-4 py-3">
                    <p class="table-main">{{ issue.title || 'Inspection issue' }}</p>
                    <p class="table-sub">{{ issueSeverity(issue) }}</p>
                  </td>
                  <td class="table-td">{{ issueSeverity(issue) }}</td>
                  <td class="px-5 py-3">
                    <RouterLink :to="`/issues/${issue.id}`" class="icon-btn" title="Open Issue">
                      <ExternalLink :size="14" />
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card h-full">
          <div class="flex items-center justify-between p-5 border-b border-gray-100/80 dark:border-gray-800">
            <h2 class="font-medium text-gray-700 dark:text-gray-200 text-sm">Open Repair Queue</h2>
            <RouterLink to="/repairs" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
              {{ store.t('viewAll') }} <ChevronRight :size="12" />
            </RouterLink>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="table-header-row">
                  <th v-for="header in repairQueueHeaders" :key="header" class="table-th">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="activeRepairs.length === 0">
                  <td :colspan="repairQueueHeaders.length" class="px-5 py-10 text-center text-sm text-gray-400">
                    No open repair work.
                  </td>
                </tr>
                <tr
                  v-for="repair in activeRepairs"
                  :key="repair.id"
                  class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
                >
                  <td class="px-4 py-3">
                    <VehiclePreviewCell :vehicle="repair.vehicles" />
                  </td>
                  <td class="table-td">{{ repair.title || repair.issues?.title || 'Repair' }}</td>
                  <td class="px-5 py-3"><span :class="repairStatusBadge(repair.status)">{{ repairStatusLabel(repair.status) }}</span></td>
                  <td class="px-5 py-3">
                    <RouterLink :to="`/repairs?repairId=${repair.id}`" class="icon-btn" title="Open Repair">
                      <ExternalLink :size="14" />
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="card mb-6">
        <div class="flex items-center justify-between p-5 border-b border-gray-100/80 dark:border-gray-800">
          <h2 class="font-medium text-gray-700 dark:text-gray-200 text-sm">Recent Reports</h2>
          <RouterLink to="/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
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
                  No reports yet.
                </td>
              </tr>
              <tr
                v-for="report in recentReports"
                :key="report.id"
                class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
              >
                <td class="px-4 py-3">
                  <VehiclePreviewCell :vehicle="report.vehicle" />
                </td>
                <td class="table-td">{{ report.driver }}</td>
                <td class="table-td">{{ typeLabel(report.type) }}</td>
                <td class="px-5 py-3"><span :class="resultBadge(report.result)">{{ resultLabel(report.result) }}</span></td>
                <td class="table-td">{{ formatDate(report.date) }}</td>
                <td class="px-5 py-3">
                  <RouterLink :to="`/reports/${report.id}`" class="icon-btn" title="Open Report">
                    <FileText :size="14" />
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import {
  AlertTriangle,
  Car,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'

const store = useAppStore()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const vehicles = ref<any[]>([])
const drivers = ref<any[]>([])
const inspections = ref<any[]>([])
const analyticsInspections = ref<any[]>([])
const openIssues = ref<any[]>([])
const activeRepairs = ref<any[]>([])
const reportsTodayCount = ref(0)
const failedReportCount = ref(0)
const underReviewIssueCount = ref(0)
const inRepairIssueCount = ref(0)

onMounted(fetchDashboard)

watch(
  () => authStore.companyId,
  () => fetchDashboard()
)

async function fetchDashboard() {
  if (!authStore.companyId) {
    vehicles.value = []
    drivers.value = []
    inspections.value = []
    analyticsInspections.value = []
    openIssues.value = []
    activeRepairs.value = []
    reportsTodayCount.value = 0
    failedReportCount.value = 0
    underReviewIssueCount.value = 0
    inRepairIssueCount.value = 0
    return
  }

  loading.value = true
  error.value = null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const analyticsStart = new Date()
  analyticsStart.setDate(analyticsStart.getDate() - 29)
  analyticsStart.setHours(0, 0, 0, 0)

  const [
    vehicleResult,
    driverResult,
    inspectionResult,
    analyticsInspectionResult,
    issueResult,
    repairResult,
    reportsTodayResult,
    failedReportsResult,
    underReviewIssuesResult,
    inRepairIssuesResult,
  ] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, unit, make, model, plate, status')
      .eq('company_id', authStore.companyId),
    supabase
      .from('drivers')
      .select('id, name, status')
      .eq('company_id', authStore.companyId),
    supabase
      .from('inspections')
      .select(`
        id,
        vehicle_id,
        driver_id,
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
        drivers (
          name
        ),
        inspection_results (
          id,
          result
        ),
        issues (
          id,
          status
        )
      `)
      .eq('company_id', authStore.companyId)
      .order('created_at', { ascending: false })
      .limit(25),
    supabase
      .from('inspections')
      .select(`
        id,
        type,
        status,
        created_at,
        submitted_at,
        drivers (
          id,
          name
        ),
        inspection_results (
          id,
          result
        )
      `)
      .eq('company_id', authStore.companyId)
      .gte('created_at', analyticsStart.toISOString())
      .order('created_at', { ascending: true })
      .limit(1000),
    supabase
      .from('issues')
      .select(`
        id,
        title,
        status,
        created_at,
        vehicles (
          unit,
          make,
          model,
          plate,
          photo_url
        ),
        inspection_results (
          inspection_template_items (
            title,
            category
          )
        )
      `)
      .eq('company_id', authStore.companyId)
      .eq('status', 'under-review')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('repairs')
      .select(`
        id,
        title,
        status,
        priority,
        created_at,
        vehicles (
          unit,
          make,
          model,
          plate,
          photo_url
        ),
        issues (
          title,
          status
        )
      `)
      .eq('company_id', authStore.companyId)
      .in('status', ['open', 'in-progress'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('inspections')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', authStore.companyId)
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('inspections')
      .select('id, inspection_results!inner(result)', { count: 'exact', head: true })
      .eq('company_id', authStore.companyId)
      .neq('status', 'draft')
      .eq('inspection_results.result', 'fail'),
    supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', authStore.companyId)
      .eq('status', 'under-review'),
    supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', authStore.companyId)
      .eq('status', 'in-repair'),
  ])

  const firstError =
    vehicleResult.error ||
    driverResult.error ||
    inspectionResult.error ||
    analyticsInspectionResult.error ||
    issueResult.error ||
    repairResult.error ||
    reportsTodayResult.error ||
    failedReportsResult.error ||
    underReviewIssuesResult.error ||
    inRepairIssuesResult.error

  if (firstError) {
    error.value = firstError.message
    loading.value = false
    return
  }

  vehicles.value = vehicleResult.data || []
  drivers.value = driverResult.data || []
  inspections.value = inspectionResult.data || []
  analyticsInspections.value = analyticsInspectionResult.data || []
  openIssues.value = issueResult.data || []
  activeRepairs.value = repairResult.data || []
  reportsTodayCount.value = reportsTodayResult.count || 0
  failedReportCount.value = failedReportsResult.count || 0
  underReviewIssueCount.value = underReviewIssuesResult.count || 0
  inRepairIssueCount.value = inRepairIssuesResult.count || 0
  loading.value = false
}

const weekBuckets = computed(() => {
  const days = buildCurrentWeekDays()
  const byKey = new Map(days.map((day) => [day.key, { ...day, total: 0 }]))

  for (const inspection of analyticsInspections.value) {
    if (inspection.status === 'draft') continue
    const key = dayKey(inspection.submitted_at || inspection.created_at)
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

  return analyticsInspections.value.filter((inspection) => {
    if (inspection.status === 'draft') return false
    const time = new Date(inspection.submitted_at || inspection.created_at).getTime()
    return time >= previousStart.getTime() && time < currentStart.getTime()
  }).length
})
const weekTrendLabel = computed(() => {
  if (!previousWeekTotal.value && weekTotal.value) return '+100%'
  if (!previousWeekTotal.value) return '0%'
  const change = Math.round(((weekTotal.value - previousWeekTotal.value) / previousWeekTotal.value) * 100)
  return `${change >= 0 ? '+' : ''}${change}%`
})

const failureTrendRows = computed(() => {
  const rows = [
    { label: 'Failed reports', count: failedReportCount.value, color: 'bg-red-500' },
    { label: 'Issues under review', count: underReviewIssueCount.value, color: 'bg-amber-500' },
    { label: 'In repair', count: inRepairIssueCount.value, color: 'bg-orange-500' },
  ]
  const max = Math.max(1, ...rows.map((row) => row.count))

  return rows.map((row) => ({
    ...row,
    pct: row.count ? Math.max(8, (row.count / max) * 100) : 0,
  }))
})

const recentReports = computed(() =>
  inspections.value.slice(0, 5).map((inspection) => {
    const vehicle = relation(inspection.vehicles)
    const driver = relation(inspection.drivers)
    const results = relationArray(inspection.inspection_results)
    const failed = results.some((row: any) => row.result === 'fail')

    return {
      id: inspection.id,
      vehicle,
      driver: driver?.name || '—',
      type: inspection.type,
      result: inspection.status === 'draft' ? 'draft' : failed ? 'fail' : 'pass',
      date: inspection.submitted_at || inspection.created_at,
    }
  })
)

const statsCards = computed(() => [
  stat('Total Vehicles', vehicles.value.length, Truck, 'blue'),
  stat('Active Vehicles', countVehicles('active'), Car, 'green'),
  stat('Vehicles Needing Attention', countVehicles('needs-attention'), AlertTriangle, 'orange', countVehicles('needs-attention') > 0),
  stat('Vehicles In Repair', countVehicles('in-repair'), Wrench, 'orange', countVehicles('in-repair') > 0),
  stat('Total Drivers', drivers.value.length, Users, 'blue'),
  stat('Active Drivers', drivers.value.filter((driver) => driver.status === 'active').length, UserCheck, 'green'),
  stat('Reports Today', reportsTodayCount.value, ClipboardCheck, 'blue'),
  stat('Failed / Under Review', failedReportCount.value + underReviewIssueCount.value, AlertTriangle, 'red', failedReportCount.value > 0 || underReviewIssueCount.value > 0),
])

const reportHeaders = ['Vehicle', 'Driver', 'Type', 'Result', 'Date', 'Action']
const repairQueueHeaders = ['Vehicle', 'Issue', 'Status', 'Action']
const issueHeaders = ['Vehicle', 'Issue', 'Severity', 'Action']

const VehiclePreviewCell = defineComponent({
  name: 'VehiclePreviewCell',
  props: {
    vehicle: {
      type: [Object, Array] as any,
      default: null,
    },
  },
  setup(props) {
    return () => {
      const row = relation(props.vehicle)
      const name = `${row?.make || ''} ${row?.model || ''}`.trim() || row?.unit || 'Vehicle'
      const subtitle = [row?.unit ? `#${row.unit}` : '', row?.plate || ''].filter(Boolean).join(' · ') || '—'

      return h('div', { class: 'flex items-center gap-3 min-w-56' }, [
        h(
          'div',
          {
            class:
              'w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center',
          },
          row?.photo_url
            ? [h('img', { src: row.photo_url, alt: '', class: 'w-full h-full object-cover' })]
            : [h(Truck, { size: 15, class: 'text-gray-400' })]
        ),
        h('div', null, [
          h('p', { class: 'text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap' }, name),
          h('p', { class: 'text-xs font-mono text-gray-400' }, subtitle),
        ]),
      ])
    }
  },
})

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

function countVehicles(status: string) {
  return vehicles.value.filter((vehicle) => vehicle.status === status).length
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

function relation(value: any) {
  return Array.isArray(value) ? value[0] : value
}

function relationArray(value: any) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function vehicleLabel(vehicle: any) {
  const name = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()
  return [name, vehicle?.unit ? `#${vehicle.unit}` : '', vehicle?.plate || ''].filter(Boolean).join(' · ') || '—'
}

function typeLabel(type: string) {
  return type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
}

function resultLabel(result: string) {
  if (result === 'draft') return store.t('statusDraft')
  return result === 'fail' ? store.t('statusFailed') : store.t('statusPassed')
}

function resultBadge(result: string) {
  if (result === 'draft') return 'badge-yellow'
  return result === 'fail' ? 'badge-red' : 'badge-green'
}

function repairStatusLabel(status: string) {
  return status === 'in-progress' ? store.t('statusInProgress') : store.t('statusOpen')
}

function repairStatusBadge(status: string) {
  return status === 'in-progress' ? 'badge-orange' : 'badge-blue'
}

function issueSeverity(issue: any) {
  return issue.inspection_results?.inspection_template_items?.category || 'Inspection issue'
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language)
}
</script>
