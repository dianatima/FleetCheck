<template>
  <AppLayout title="Issues">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchIssues')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="under-review">{{ store.t('statusUnderReview') }}</option>
          <option value="in-repair">{{ store.t('statusInRepair') }}</option>
          <option value="fixed">{{ store.t('statusFixed') }}</option>
          <option value="rejected">{{ store.t('statusRejected') }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="card p-6 text-sm text-gray-500">Loading issues...</div>
    <div v-else-if="error" class="card p-6 text-sm text-red-500">{{ error }}</div>
    <div v-else class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100/80 dark:border-gray-800">
        <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
          Issues
        </h2>
      </div>
      <div class="overflow-x-auto">
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
              <td class="table-td">{{ vehicleLabel(issue) }}</td>
              <td class="table-td">{{ issue.drivers?.name || '—' }}</td>
              <td class="table-td">{{ inspectionLabel(issue) }}</td>
              <td class="px-4 py-3"><span :class="statusBadge[issue.status] || 'badge-gray'">{{ statusText(issue.status) }}</span></td>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Wrench } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const store = useAppStore()
const authStore = useAuthStore()
const search = ref('')
const filterStatus = ref('all')
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

onMounted(fetchIssues)

watch(
  () => authStore.companyId,
  async () => fetchIssues()
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
          category
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

const issueHeaders = computed(() => [store.t('issue'), store.t('vehicle'), store.t('driver'), store.t('inspection'), store.t('status')])

const filtered = computed(() => issues.value.filter((issue) => {
  const q = search.value.trim().toLowerCase()
  const haystack = [
    issue.title,
    issue.description,
    vehicleLabel(issue),
    issue.drivers?.name,
    issueNumber(issue),
    issue.inspection_results?.inspection_template_items?.title,
  ].filter(Boolean).join(' ').toLowerCase()
  const matchSearch = !q || haystack.includes(q)
  const matchStatus = filterStatus.value === 'all' || issue.status === filterStatus.value
  return matchSearch && matchStatus
}))

const paginatedIssues = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, filterStatus, pageSize], () => {
  page.value = 1
})

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

function statusText(status: string) {
  return {
    'under-review': store.t('statusUnderReview'),
    'in-repair': store.t('statusInRepair'),
    fixed: store.t('statusFixed'),
    rejected: store.t('statusRejected'),
  }[status] || status || '—'
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
</style>
