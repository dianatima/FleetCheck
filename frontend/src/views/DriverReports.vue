<template>
  <AppLayout title="Reports">
    <!-- Summary bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.value }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          class="input-field pl-9 py-1.5 text-sm"
          placeholder="Search reports..."
        />
      </div>
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterResult" class="input-field py-1.5 text-sm w-40" aria-label="Report status">
          <option value="all">{{ store.t('allResults') }}</option>
          <option value="pass">{{ store.t('statusPassed') }}</option>
          <option value="fail">{{ store.t('statusFailed') }}</option>
        </select>
        <select v-model="filterType" class="input-field py-1.5 text-sm w-36" aria-label="Inspection type">
          <option value="all">{{ store.t('allTypes') }}</option>
          <option value="pre-trip">{{ store.t('preTrip') }}</option>
          <option value="post-trip">{{ store.t('postTrip') }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Date range:
        </span>
        <BaseDateInput v-model="startDate" input-class="py-1.5 text-sm w-36" />
        <span class="text-gray-400 text-sm">—</span>
        <BaseDateInput v-model="endDate" input-class="py-1.5 text-sm w-36" />
      </div>
    </div>

    <div v-if="error" class="card p-4 mb-5 text-sm text-red-500">
      {{ error }}
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100/80 dark:border-gray-800">
        <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
          Reports
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header-row">
              <th v-for="h in driverReportHeaders" :key="h"
                class="table-th">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedReports.length === 0">
              <td :colspan="driverReportHeaders.length" class="text-center py-12 text-sm text-gray-400">
                {{ loading ? 'Loading reports...' : store.t('noReportsFound') }}
              </td>
            </tr>
            <tr
              v-for="r in paginatedReports"
              :key="r.id"
              class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors cursor-pointer"
              @click="viewReport(r)"
            >
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ r.date }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <Truck :size="13" class="text-gray-400 flex-shrink-0" />
                  <span class="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ r.vehicle }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.type }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <FileEdit v-if="r.result === 'draft'" :size="13" class="text-amber-500" />
                  <CheckCircle v-else-if="r.result === 'pass'" :size="13" class="text-green-500" />
                  <XCircle v-else :size="13" class="text-red-500" />
                  <span :class="resultBadge(r)" class="text-xs">{{ resultLabel(r) }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span v-if="r.issues > 0" class="badge-red">{{ r.issues }}</span>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-4 py-3">
                <div v-if="r.photos > 0" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Camera :size="12" /> {{ r.photos }}
                </div>
                <span v-else class="text-gray-400 text-xs">—</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="r.status === 'draft'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                  <FileEdit :size="10" /> {{ store.t('statusDraft') }}
                </span>
                <span v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
                  <Send :size="10" /> {{ store.t('statusSubmitted') }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <template v-if="r.status === 'draft'">
                    <button
                      @click.stop="continueDraft(r)"
                      title="Continue draft"
                      class="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                      <Pencil :size="13" />
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click.stop="viewReport(r)"
                      title="View report"
                      class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <FileText :size="13" />
                    </button>
                    <button
                      @click.stop="downloadReport(r)"
                      :title="downloadingId === r.id ? 'Preparing PDF...' : 'Download PDF'"
                      :disabled="downloadingId === r.id"
                      class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-wait transition-colors">
                      <Download :size="13" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <BaseTablePagination
        :total="filtered.length"
        :current-page="page"
        :page-size="pageSize"
        @update:current-page="page = $event"
        @update:page-size="setPageSize"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Filter, Search, Download, Truck, CheckCircle, XCircle, Camera, FileText, Pencil, Send, File as FileEdit } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import BaseDateInput from '@/components/shared/BaseDateInput.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'
import { downloadInspectionReportPdf } from '@/lib/reportPdf'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const filterType = ref('all')
const filterResult = ref('all')
const search = ref('')
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)
const downloadingId = ref<string | null>(null)

interface Report {
  id: string
  vehicleId: string
  date: string
  createdAt: string
  vehicle: string
  driver: string
  type: 'pre-trip' | 'post-trip'
  result: 'pass' | 'fail' | 'draft'
  issues: number
  photos: number
  status: 'draft' | 'submitted' | 'approved' | 'needs-review' | 'rejected'
}

const reports = ref<Report[]>([])

onMounted(fetchReports)

watch(
  () => authStore.profile?.id,
  async (profileId) => {
    if (profileId) await fetchReports()
  }
)

async function fetchReports() {
  if (!authStore.profile?.id) return

  loading.value = true
  error.value = null

  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('id, company_id')
    .eq('user_id', authStore.profile.id)
    .eq('status', 'active')
    .maybeSingle()

  if (driverError || !driver) {
    error.value = driverError?.message || `Active driver row was not found for profile.id ${authStore.profile.id}.`
    reports.value = []
    loading.value = false
    return
  }

  const { data: inspections, error: inspectionsError } = await supabase
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
        plate
      ),
      inspection_results (
        id,
        result,
        photo_urls,
        inspection_template_items (
          title,
          category
        )
      ),
      issues (
        id,
        status
      )
    `)
    .eq('driver_id', driver.id)
    .eq('company_id', driver.company_id)
    .order('created_at', { ascending: false })

  if (inspectionsError) {
    error.value = inspectionsError.message
    reports.value = []
    loading.value = false
    return
  }

  reports.value = normalizeInspectionRows(inspections || []).map((inspection: any) => {
    const vehicle = Array.isArray(inspection.vehicles) ? inspection.vehicles[0] : inspection.vehicles
    const results = normalizeRelationArray(inspection.inspection_results)
    const issues = normalizeRelationArray(inspection.issues)
    const failed = results.some((row: any) => row.result === 'fail')
    const photos = results.reduce((count: number, row: any) => count + (row.photo_urls?.length || 0), 0)
    const name = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()
    const driverName = [
      authStore.profile?.first_name,
      authStore.profile?.last_name,
    ].filter(Boolean).join(' ') || authStore.profile?.email || ''

    return {
      id: inspection.id,
      vehicleId: inspection.vehicle_id,
      createdAt: inspection.submitted_at || inspection.created_at,
      date: formatDate(inspection.submitted_at || inspection.created_at),
      vehicle: [name, vehicle?.unit ? `#${vehicle.unit}` : '', vehicle?.plate || ''].filter(Boolean).join(' · ') || '—',
      driver: driverName,
      type: inspection.type === 'post-trip' ? 'post-trip' : 'pre-trip',
      status: inspection.status,
      result: inspection.status === 'draft' ? 'draft' : failed ? 'fail' : 'pass',
      issues: issues.length,
      photos,
    }
  })

  loading.value = false
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language)
}

function continueDraft(r: Report) {
  router.push(`/inspect/${r.type === 'post-trip' ? 'post' : 'pre'}?inspectionId=${r.id}&vehicleId=${r.vehicleId}`)
}

function viewReport(r: Report) {
  router.push(`/driver/reports/${r.id}`)
}

async function downloadReport(r: Report) {
  downloadingId.value = r.id
  error.value = null

  try {
    await downloadInspectionReportPdf(r.id, store.language)
  } catch (downloadError: any) {
    error.value = downloadError?.message || 'Report PDF could not be downloaded.'
  } finally {
    downloadingId.value = null
  }
}

function resultBadge(report: Report) {
  if (report.result === 'draft') return 'badge-yellow'
  return report.result === 'pass' ? 'badge-green' : 'badge-red'
}

function resultLabel(report: Report) {
  if (report.result === 'draft') return store.t('statusDraft')
  return report.result === 'pass' ? store.t('pass') : store.t('fail')
}

function normalizeInspectionRows(rows: any[]) {
  const byId = new Map<string, any>()

  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, {
        ...row,
        inspection_results: normalizeRelationArray(row.inspection_results),
        issues: normalizeRelationArray(row.issues),
      })
      continue
    }

    const existing = byId.get(row.id)
    existing.inspection_results = mergeById(existing.inspection_results, normalizeRelationArray(row.inspection_results))
    existing.issues = mergeById(existing.issues, normalizeRelationArray(row.issues))
  }

  return [...byId.values()]
}

function normalizeRelationArray(value: any) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function mergeById(left: any[], right: any[]) {
  const byId = new Map<string, any>()
  for (const item of [...left, ...right]) {
    if (item?.id) byId.set(item.id, item)
  }
  return [...byId.values()]
}

const passCount = computed(() => reports.value.filter(r => r.result === 'pass').length)
const failCount = computed(() => reports.value.filter(r => r.result === 'fail').length)

const summaryStats = computed(() => [
  { label: store.t('reports'), value: reports.value.length, color: 'text-gray-900 dark:text-white' },
  { label: store.t('statusPassed'), value: passCount.value, color: 'text-green-600 dark:text-green-400' },
  { label: store.t('statusFailed'), value: failCount.value, color: 'text-red-600 dark:text-red-400' },
  { label: 'Pass Rate', value: reports.value.length ? `${Math.round((passCount.value / reports.value.length) * 100)}%` : '0%', color: 'text-blue-600 dark:text-blue-400' },
])

const driverReportHeaders = computed(() => [store.t('date'), store.t('vehicle'), store.t('type'), store.t('result'), store.t('issues'), store.t('photos'), store.t('status'), store.t('actions')])

const filtered = computed(() => reports.value.filter(r => {
  const query = search.value.trim().toLowerCase()
  const matchType   = filterType.value   === 'all' || r.type === filterType.value
  const matchResult = filterResult.value === 'all' || r.result === filterResult.value
  const time = new Date(r.createdAt).getTime()
  const afterStart = !startDate.value || time >= new Date(`${startDate.value}T00:00:00`).getTime()
  const beforeEnd = !endDate.value || time <= new Date(`${endDate.value}T23:59:59`).getTime()
  const searchableText = [
    r.vehicle,
    r.driver,
    typeLabel(r.type),
    resultLabel(r),
    r.status,
    r.date,
  ].join(' ').toLowerCase()
  const matchSearch = !query || searchableText.includes(query)

  return matchSearch && matchType && matchResult && afterStart && beforeEnd
}))

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value))
)
const paginatedReports = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
watch([search, filterType, filterResult, startDate, endDate, pageSize], () => {
  page.value = 1
})

function typeLabel(type: string) {
  return type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
}

function setPageSize(size: number) {
  pageSize.value = size
  page.value = 1
}
</script>
