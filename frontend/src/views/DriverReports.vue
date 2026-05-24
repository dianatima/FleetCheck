<template>
  <AppLayout :title="store.t('myReports')">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.value }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="flex items-center gap-2 flex-1">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterType" class="input-field py-1.5 text-sm flex-1">
          <option value="all">{{ store.t('allTypes') }}</option>
          <option value="Pre-Trip">{{ store.t('preTrip') }}</option>
          <option value="Post-Trip">{{ store.t('postTrip') }}</option>
        </select>
        <select v-model="filterResult" class="input-field py-1.5 text-sm flex-1">
          <option value="all">{{ store.t('allResults') }}</option>
          <option value="pass">{{ store.t('statusPassed') }}</option>
          <option value="fail">{{ store.t('statusFailed') }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary gap-1.5 text-sm py-2"><Download :size="14" /> {{ store.t('pdf') }}</button>
        <button class="btn-secondary gap-1.5 text-sm py-2"><Download :size="14" /> {{ store.t('csv') }}</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in driverReportHeaders" :key="h" class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="reportsLoading">
              <td :colspan="driverReportHeaders.length" class="text-center py-12 text-sm text-gray-400">{{ store.t('loadingReports') }}</td>
            </tr>
            <tr v-else-if="reportsError">
              <td :colspan="driverReportHeaders.length" class="text-center py-12 text-sm text-red-500">{{ reportsError }}</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td :colspan="driverReportHeaders.length" class="text-center py-12 text-sm text-gray-400">{{ store.t('noReportsFound') }}</td>
            </tr>
            <tr
              v-for="r in filtered"
              :key="r.id"
              tabindex="0"
              role="button"
              class="border-b border-gray-50 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:border-gray-700/50 dark:hover:bg-gray-700/30 dark:focus:bg-gray-700/30 cursor-pointer"
              @click="openReport(r.id)"
              @keydown.enter="openReport(r.id)"
              @keydown.space.prevent="openReport(r.id)"
            >
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ r.date }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <Truck :size="13" class="text-gray-400 flex-shrink-0" />
                  <span class="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ r.vehicle }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.performedBy }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.type }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <CheckCircle v-if="r.result === 'pass'" :size="13" class="text-green-500" />
                  <XCircle v-else :size="13" class="text-red-500" />
                  <span :class="r.result === 'pass' ? 'badge-green' : 'badge-red'" class="text-xs">{{ r.result === 'pass' ? store.t('pass') : store.t('fail') }}</span>
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
                <CheckCircle v-if="r.signed" :size="14" class="text-green-500" />
                <span v-else class="text-gray-400 text-xs">{{ store.t('noLabel') }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700">
                  <Send :size="10" /> {{ store.t('statusSubmitted') }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button :title="store.t('viewReport')" @click.stop="openReport(r.id)" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <FileText :size="13" />
                  </button>
                  <button :title="store.t('downloadPdf')" @click.stop class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <Download :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('showing') }} {{ filtered.length }} {{ store.t('of') }} {{ reports.length }}</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Filter, Download, Truck, CheckCircle, XCircle, Camera, FileText, Send } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchInspectionReports, type InspectionReportRecord } from '@/lib/inspectionReports'

const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const filterType = ref('all')
const filterResult = ref('all')
const reports = ref<InspectionReportRecord[]>([])
const reportsLoading = ref(false)
const reportsError = ref('')

function normalizeReportQuery(value: unknown) {
  return typeof value === 'string' && ['all', 'Pre-Trip', 'Post-Trip'].includes(value) ? value : 'all'
}

function normalizeResultQuery(value: unknown) {
  return typeof value === 'string' && ['all', 'pass', 'fail'].includes(value) ? value : 'all'
}

async function loadReports() {
  reportsError.value = ''

  if (!authStore.companyId) {
    reports.value = []
    return
  }

  reportsLoading.value = true

  try {
    reports.value = await fetchInspectionReports(authStore.companyId, {
      driverAuthUserId: authStore.user?.id || null,
    })
  } catch (loadError: any) {
    reportsError.value = loadError?.message || store.t('unableToLoadReports')
    reports.value = []
  } finally {
    reportsLoading.value = false
  }
}

onMounted(loadReports)
watch(() => authStore.companyId, loadReports)
watch(
  () => route.query,
  (query) => {
    filterType.value = normalizeReportQuery(query.type)
    filterResult.value = normalizeResultQuery(query.result)
  },
  { immediate: true },
)

const passCount = computed(() => reports.value.filter((report) => report.result === 'pass').length)
const failCount = computed(() => reports.value.filter((report) => report.result === 'fail').length)

const summaryStats = computed(() => [
  { label: store.t('reports'), value: reports.value.length, color: 'text-gray-900 dark:text-white' },
  { label: store.t('statusPassed'), value: passCount.value, color: 'text-green-600 dark:text-green-400' },
  { label: store.t('statusFailed'), value: failCount.value, color: 'text-red-600 dark:text-red-400' },
  { label: store.t('passRate'), value: reports.value.length ? `${Math.round((passCount.value / reports.value.length) * 100)}%` : '0%', color: 'text-blue-600 dark:text-blue-400' },
])

const driverReportHeaders = computed(() => [store.t('date'), store.t('vehicle'), store.t('reportedBy'), store.t('type'), store.t('result'), store.t('issues'), store.t('photos'), store.t('signature'), store.t('status'), store.t('actions')])

const filtered = computed(() => reports.value.filter((report) => {
  const matchType = filterType.value === 'all' || report.type === filterType.value
  const matchResult = filterResult.value === 'all' || report.result === filterResult.value
  return matchType && matchResult
}))

function openReport(reportId: string) {
  void router.push({
    name: 'driver-report-detail',
    params: { id: reportId },
  })
}
</script>
