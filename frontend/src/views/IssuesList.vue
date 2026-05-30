<template>
  <AppLayout title="Issues">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative w-full sm:flex-1 sm:min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchIssues')" />
      </div>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterStatus" class="input-field py-2 text-sm sm:w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="under-review">{{ store.t('statusUnderReview') }}</option>
          <option value="in-repair">{{ store.t('statusInRepair') }}</option>
          <option value="fixed">{{ store.t('statusFixed') }}</option>
          <option value="rejected">{{ store.t('statusRejected') }}</option>
        </select>
      </div>
      <select v-model="filterDriver" class="input-field py-2 text-sm sm:w-auto">
        <option value="all">All Drivers</option>
        <option v-for="driver in driverOptions" :key="driver.id" :value="driver.id">
          {{ driver.name }}
        </option>
      </select>
      <select v-model="filterSeverity" class="input-field py-2 text-sm sm:w-auto">
        <option value="all">All Severities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select v-model="filterVehicle" class="input-field py-2 text-sm sm:w-auto">
        <option value="all">All Vehicles</option>
        <option v-for="vehicle in vehicleOptions" :key="vehicle.id" :value="vehicle.id">
          {{ vehicle.label }}
        </option>
      </select>
    </div>

    <div v-if="activeFilterChips.length" class="flex flex-wrap gap-2 mb-5">
      <span
        v-for="chip in activeFilterChips"
        :key="chip.key"
        class="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
      >
        {{ chip.label }}
        <button type="button" class="font-medium hover:underline" @click="clearFilterChip(chip.key)">
          Clear
        </button>
      </span>
    </div>

    <div v-if="loading" class="card p-6 text-sm text-gray-500">Loading issues...</div>
    <div v-else-if="error" class="card p-6 text-sm text-red-500">{{ error }}</div>
    <div v-else class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100/80 dark:border-gray-800">
        <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
          Issues
        </h2>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header-row">
              <th v-for="h in issueHeaders" :key="h" class="table-th">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedIssues.length === 0">
              <td :colspan="issueHeaders.length" class="text-center py-12 text-sm text-gray-400">
                {{ store.t('noIssuesFound') }}
              </td>
            </tr>
            <tr
              v-for="issue in paginatedIssues"
              :key="issue.id"
              class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors cursor-pointer"
              @click="router.push(`/issues/${issue.id}`)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench :size="14" class="text-orange-500" />
                  </div>
                  <div>
                    <span class="text-xs font-mono text-blue-600 dark:text-blue-400 block leading-none mb-0.5">
                      {{ issueNumber(issue) }}
                    </span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white max-w-56 truncate block">
                      {{ issue.title || 'Inspection issue' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span :class="severityBadge(issue.severity)">{{ severityLabel(issue.severity) }}</span>
              </td>
              <td class="table-td">{{ vehicleLabel(issue) }}</td>
              <td class="table-td">{{ issue.drivers?.name || '—' }}</td>
              <td class="table-td">{{ inspectionLabel(issue) }}</td>
              <td class="px-4 py-3"><span :class="statusBadge[issue.status] || 'badge-gray'">{{ statusText(issue.status) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        <div v-if="paginatedIssues.length === 0" class="px-4 py-12 text-center text-sm text-gray-400">
          {{ store.t('noIssuesFound') }}
        </div>
        <div
          v-for="issue in paginatedIssues"
          :key="issue.id"
          class="p-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/45"
          role="button"
          tabindex="0"
          @click="router.push(`/issues/${issue.id}`)"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20">
              <Wrench :size="16" class="text-orange-500" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs font-mono text-blue-600 dark:text-blue-400">{{ issueNumber(issue) }}</p>
                  <p class="mobile-card-title truncate">{{ issue.title || 'Inspection issue' }}</p>
                  <p class="mobile-card-meta">{{ vehicleLabel(issue) }}</p>
                </div>
                <span :class="severityBadge(issue.severity)" class="flex-shrink-0">
                  {{ severityLabel(issue.severity) }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
              <p class="text-gray-400">Driver</p>
              <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">{{ issue.drivers?.name || '—' }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
              <p class="text-gray-400">Status</p>
              <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">{{ statusText(issue.status) }}</p>
            </div>
          </div>
        </div>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Filter, Wrench } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()
const search = ref('')
const filterStatus = ref('all')
const filterDriver = ref('all')
const filterSeverity = ref('all')
const filterVehicle = ref('all')
const issues = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(10)

const statusBadge: Record<string, string> = {
  'under-review': 'badge-yellow',
  'in-repair': 'badge-orange',
  fixed: 'badge-green',
  rejected: 'badge-gray',
}

onMounted(async () => {
  syncFiltersFromQuery()
  await fetchIssues()
})

watch(
  () => authStore.companyId,
  async () => fetchIssues()
)

watch(
  () => route.query,
  () => syncFiltersFromQuery()
)

async function fetchIssues() {
  if (!authStore.companyId) return
  loading.value = true
  error.value = null

  const { data, error: issuesError } = await supabase
    .from('issues')
    .select(`
      id,
      company_id,
      vehicle_id,
      driver_id,
      inspection_id,
      inspection_result_id,
      title,
      description,
      status,
      severity,
      photo_urls,
      created_at,
      vehicles (
        id,
        unit,
        make,
        model,
        status
      ),
      drivers (
        id,
        name
      ),
      inspections (
        id,
        type,
        created_at,
        submitted_at
      ),
      inspection_results (
        id,
        inspection_template_items (
          title,
          category_id,
          inspection_item_categories (
            id,
            name,
            severity
          )
        )
      )
    `)
    .eq('company_id', authStore.companyId)
    .order('created_at', { ascending: false })

  if (issuesError) {
    error.value = issuesError.message
    issues.value = []
  } else {
    issues.value = data || []
  }

  loading.value = false
}

const summaryStats = computed(() => [
  { label: store.t('statusUnderReview'), count: issues.value.filter(i => i.status === 'under-review').length, color: 'text-yellow-600 dark:text-yellow-400' },
  { label: store.t('statusInRepair'), count: issues.value.filter(i => i.status === 'in-repair').length, color: 'text-orange-600 dark:text-orange-400' },
  { label: store.t('statusFixed'), count: issues.value.filter(i => i.status === 'fixed').length, color: 'text-green-600 dark:text-green-400' },
])

const driverOptions = computed(() => {
  const byId = new Map<string, { id: string; name: string }>()

  for (const issue of issues.value) {
    const driver = relation(issue.drivers)
    if (driver?.id) byId.set(driver.id, { id: driver.id, name: driver.name || 'Unnamed driver' })
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
})

const vehicleOptions = computed(() => {
  const byId = new Map<string, { id: string; label: string }>()

  for (const issue of issues.value) {
    const vehicle = relation(issue.vehicles)
    if (vehicle?.id) byId.set(vehicle.id, { id: vehicle.id, label: vehicleLabel({ vehicles: vehicle }) })
  }

  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const activeFilterChips = computed(() => {
  const chips: Array<{ key: string; label: string }> = []

  if (filterDriver.value !== 'all') {
    chips.push({
      key: 'driver_id',
      label: `Driver: ${driverOptions.value.find((driver) => driver.id === filterDriver.value)?.name || 'Selected driver'}`,
    })
  }

  if (filterVehicle.value !== 'all') {
    chips.push({
      key: 'vehicle_id',
      label: `Vehicle: ${vehicleOptions.value.find((vehicle) => vehicle.id === filterVehicle.value)?.label || 'Selected vehicle'}`,
    })
  }

  if (filterSeverity.value !== 'all') {
    chips.push({
      key: 'severity',
      label: `Severity: ${severityLabel(filterSeverity.value)}`,
    })
  }

  return chips
})

const issueHeaders = computed(() => [
  store.t('issue'),
  store.t('severity'),
  store.t('vehicle'),
  store.t('driver'),
  store.t('inspection'),
  store.t('status'),
])

const filtered = computed(() => issues.value.filter((issue) => {
  const q = search.value.trim().toLowerCase()
  const templateItem = issueTemplateItem(issue)
  const selectedCategory = String(route.query.category || '')
  const haystack = [
    issue.title,
    issue.description,
    vehicleLabel(issue),
    issue.drivers?.name,
    issueNumber(issue),
    severityLabel(issue.severity),
    templateItem?.title,
    templateItem?.inspection_item_categories?.name,
  ].filter(Boolean).join(' ').toLowerCase()
  const matchSearch = !q || haystack.includes(q)
  const matchStatus = filterStatus.value === 'all' || issue.status === filterStatus.value
  const matchDriver = filterDriver.value === 'all' || issue.driver_id === filterDriver.value
  const matchSeverity = filterSeverity.value === 'all' || issue.severity === filterSeverity.value
  const matchVehicle = filterVehicle.value === 'all' || issue.vehicle_id === filterVehicle.value
  const matchCategory =
    !selectedCategory ||
    templateItem?.category_id === selectedCategory ||
    templateItem?.inspection_item_categories?.id === selectedCategory ||
    templateItem?.inspection_item_categories?.name === selectedCategory

  return matchSearch && matchStatus && matchDriver && matchSeverity && matchVehicle && matchCategory
}))

const paginatedIssues = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([
  search,
  filterStatus,
  filterDriver,
  filterSeverity,
  filterVehicle,
  pageSize,
  () => route.query.category,
], () => {
  page.value = 1
})

function syncFiltersFromQuery() {
  filterDriver.value = String(route.query.driver_id || 'all')
  filterVehicle.value = String(route.query.vehicle_id || 'all')
  filterSeverity.value = String(route.query.severity || 'all')
  page.value = 1
}

function clearFilterChip(key: string) {
  const query = { ...route.query }
  delete query[key]

  if (key === 'driver_id') filterDriver.value = 'all'
  if (key === 'vehicle_id') filterVehicle.value = 'all'
  if (key === 'severity') filterSeverity.value = 'all'

  router.replace({ path: '/issues', query })
}

function setPageSize(size: number) {
  pageSize.value = size
  page.value = 1
}

function issueNumber(issue: any) {
  return `ISS-${String(issues.value.findIndex((row) => row.id === issue.id) + 1).padStart(3, '0')}`
}

function vehicleLabel(issue: any) {
  const vehicle = issue.vehicles
  const name = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()
  return [name, vehicle?.unit ? `#${vehicle.unit}` : ''].filter(Boolean).join(' · ') || '—'
}

function inspectionLabel(issue: any) {
  const inspection = issue.inspections
  if (!inspection) return '—'
  return inspection.type === 'post-trip' ? 'Post-trip' : 'Pre-trip'
}

function relation(value: any) {
  return Array.isArray(value) ? value[0] : value
}

function issueTemplateItem(issue: any) {
  const result = relation(issue.inspection_results)
  return relation(result?.inspection_template_items)
}

function statusText(status: string) {
  return {
    'under-review': store.t('statusUnderReview'),
    'in-repair': store.t('statusInRepair'),
    fixed: store.t('statusFixed'),
    rejected: store.t('statusRejected'),
  }[status] || status || '—'
}

function severityLabel(severity: string | null) {
  return {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }[severity || 'medium'] || 'Medium'
}

function severityBadge(severity: string | null) {
  return {
    low: 'badge-green',
    medium: 'badge-orange',
    high: 'badge-red',
  }[severity || 'medium'] || 'badge-orange'
}
</script>

<style scoped>
.table-th {
  @apply text-left text-[11px] font-medium tracking-normal text-gray-500 dark:text-gray-400 px-4 py-3.5 whitespace-nowrap;
}

.table-td {
  @apply px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap align-middle;
}

.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.badge-red { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400; }
</style>
