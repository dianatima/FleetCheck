<template>
  <AppLayout :title="store.t('issues')">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
      <button
        v-for="s in summaryStats"
        :key="s.label"
        type="button"
        class="card p-4 text-center transition-all hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 dark:hover:ring-offset-gray-950"
        :class="isSummaryActive(s) ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-950' : ''"
        @click="applySummaryFilter(s)"
      >
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchIssues')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="open">{{ store.t('statusOpen') }}</option>
          <option value="under-review">{{ store.t('statusUnderReview') }}</option>
          <option value="in-repair">{{ store.t('statusInRepair') }}</option>
          <option value="fixed">{{ store.t('statusFixed') }}</option>
          <option value="rejected">{{ store.t('statusRejected') }}</option>
        </select>
        <select v-model="filterSeverity" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allSeverity') }}</option>
          <option value="high">{{ store.t('priorityHigh') }}</option>
          <option value="medium">{{ store.t('priorityMedium') }}</option>
          <option value="low">{{ store.t('priorityLow') }}</option>
        </select>
        <select v-model="filterFraud" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('all') }}</option>
          <option value="flagged">{{ store.t('fraudFlagged') }}</option>
          <option value="clean">{{ store.t('clean') }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="issuesLoading" class="px-4 py-12 text-center text-sm text-gray-400">
        {{ store.t('loadingIssues') }}
      </div>

      <div v-else-if="issuesError" class="px-4 py-12 text-center text-sm text-red-500">
        {{ issuesError }}
      </div>

      <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in issueHeaders" :key="h"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="5" class="text-center py-12 text-sm text-gray-400">{{ store.t('noIssuesFound') }}</td>
            </tr>
            <tr v-for="issue in filtered" :key="issue.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              @click="router.push(`/issues/${issue.id}`)">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wrench :size="14" class="text-orange-500" />
                  </div>
                  <div>
                    <span class="text-xs font-mono text-blue-600 dark:text-blue-400 block leading-none mb-0.5">{{ issue.issueId }}</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-white max-w-56 truncate block">{{ issue.title }}</span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ issue.vehicle }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ issue.driver }}</td>
              <td class="px-4 py-3"><span :class="severityBadge[issue.severity]">{{ severityLabel[issue.severity] }}</span></td>
              <td class="px-4 py-3"><span :class="statusBadge[issue.status]">{{ statusLabel[issue.status] }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('showing') }} {{ filtered.length }} {{ store.t('of') }} {{ issues.length }}</span>
      </div>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Filter, Wrench } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchInspectionIssues, type InspectionIssueRecord } from '@/lib/inspectionIssues'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const authStore = useAuthStore()
const search = ref('')
const filterStatus = ref('all')
const filterSeverity = ref('all')
const filterFraud = ref('all')
const issuesLoading = ref(false)
const issuesError = ref('')

const localeMap: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  es: 'es-ES',
  fr: 'fr-FR',
}

const severityBadge: Record<string, string> = {
  high:   'badge-red',
  medium: 'badge-yellow',
  low:    'badge-gray',
}
const statusBadge: Record<string, string> = {
  open:           'badge-red',
  'under-review': 'badge-yellow',
  'in-repair':    'badge-orange',
  fixed:          'badge-green',
  rejected:       'badge-gray',
}
const statusLabel = computed<Record<string, string>>(() => ({
  open:           store.t('statusOpen'),
  'under-review': store.t('statusUnderReview'),
  'in-repair':    store.t('statusInRepair'),
  fixed:          store.t('statusFixed'),
  rejected:       store.t('statusRejected'),
}))
const severityLabel = computed<Record<string, string>>(() => ({
  high:   store.t('priorityHigh'),
  medium: store.t('priorityMedium'),
  low:    store.t('priorityLow'),
}))
const issues = ref<InspectionIssueRecord[]>([])

type SummaryFilterCard = {
  label: string
  count: number
  color: string
  mode: 'status' | 'fraud'
  value: string
}

function normalizeFilter(value: unknown, allowedValues: string[]) {
  return typeof value === 'string' && allowedValues.includes(value) ? value : 'all'
}

function syncFiltersFromRoute() {
  search.value = typeof route.query.search === 'string' ? route.query.search : ''
  filterStatus.value = normalizeFilter(route.query.status, ['all', 'open', 'under-review', 'in-repair', 'fixed', 'rejected'])
  filterSeverity.value = normalizeFilter(route.query.severity, ['all', 'high', 'medium', 'low'])
  filterFraud.value = normalizeFilter(route.query.fraud, ['all', 'flagged', 'clean'])
}

async function loadIssues(companyId = authStore.companyId, language = store.language) {
  issuesError.value = ''

  if (!companyId) {
    issues.value = []
    return
  }

  issuesLoading.value = true

  try {
    issues.value = await fetchInspectionIssues(companyId, {
      driverAuthUserId: authStore.role === 'driver' ? authStore.user?.id || null : null,
      locale: localeMap[language] || 'en-US',
    })
  } catch (loadError: any) {
    issuesError.value = loadError?.message || store.t('unableToLoadIssues')
    issues.value = []
  } finally {
    issuesLoading.value = false
  }
}

function applySummaryFilter(card: SummaryFilterCard) {
  if (card.mode === 'fraud') {
    filterFraud.value = filterFraud.value === card.value ? 'all' : card.value
    return
  }

  filterStatus.value = filterStatus.value === card.value ? 'all' : card.value
}

function isSummaryActive(card: SummaryFilterCard) {
  return card.mode === 'fraud' ? filterFraud.value === card.value : filterStatus.value === card.value
}

const summaryStats = computed<SummaryFilterCard[]>(() => [
  { label: store.t('statusOpen'),        count: issues.value.filter(i => i.status === 'open').length,         color: 'text-red-600 dark:text-red-400', mode: 'status', value: 'open' },
  { label: store.t('statusUnderReview'), count: issues.value.filter(i => i.status === 'under-review').length, color: 'text-yellow-600 dark:text-yellow-400', mode: 'status', value: 'under-review' },
  { label: store.t('statusInRepair'),    count: issues.value.filter(i => i.status === 'in-repair').length,    color: 'text-orange-600 dark:text-orange-400', mode: 'status', value: 'in-repair' },
  { label: store.t('statusFixed'),       count: issues.value.filter(i => i.status === 'fixed').length,        color: 'text-green-600 dark:text-green-400', mode: 'status', value: 'fixed' },
  { label: store.t('fraudFlagged'),      count: issues.value.filter(i => i.fraudFlag).length,                 color: 'text-red-600 dark:text-red-400', mode: 'fraud', value: 'flagged' },
])

const issueHeaders = computed(() => [store.t('issue'), store.t('vehicle'), store.t('driver'), store.t('severity'), store.t('status')])

const filtered = computed(() => issues.value.filter(i => {
  const q = search.value.toLowerCase()
  const matchSearch = i.title.toLowerCase().includes(q) || i.vehicle.toLowerCase().includes(q) || i.driver.toLowerCase().includes(q) || i.issueId.toLowerCase().includes(q)
  const matchStatus   = filterStatus.value   === 'all' || i.status   === filterStatus.value
  const matchSeverity = filterSeverity.value === 'all' || i.severity === filterSeverity.value
  const matchFraud    = filterFraud.value    === 'all' || (filterFraud.value === 'flagged' ? i.fraudFlag : !i.fraudFlag)
  return matchSearch && matchStatus && matchSeverity && matchFraud
}))

watch(() => route.query, syncFiltersFromRoute, { immediate: true })
watch(
  [() => authStore.companyId, () => store.language],
  ([companyId, language]) => {
    void loadIssues(companyId, language)
  },
  { immediate: true },
)
</script>

<style scoped>
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
</style>
