<template>
  <AppLayout :title="store.t('inspectionSummary')">
    <RouterLink :to="backRoute" class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
      <ArrowLeft :size="16" /> {{ backLabel }}
    </RouterLink>

    <div v-if="reportLoading" class="card p-12 text-center text-sm text-gray-400">
      {{ store.t('loadingReports') }}
    </div>

    <div v-else-if="reportError" class="card p-12 text-center text-sm text-red-500">
      {{ reportError }}
    </div>

    <div v-else-if="report">
      <div class="card mb-5 overflow-hidden">
        <div class="border-b border-gray-100 p-5 dark:border-gray-700">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="mb-1 flex flex-wrap items-center gap-2">
                <span class="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400" :title="report.id">{{ reportCode }}</span>
                <span :class="report.result === 'pass' ? 'badge-green' : 'badge-red'">{{ resultLabel(report.result) }}</span>
                <span v-if="report.reviewStatus" :class="reviewStatusBadge(report.reviewStatus)">{{ reviewStatusText(report.reviewStatus) }}</span>
              </div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ report.vehicle }}</h2>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ report.driver }} · {{ inspectionTypeLabel(report.inspectionType) }}</p>
            </div>

            <RouterLink
              v-if="report.vehicleId"
              :to="`/vehicles/${report.vehicleId}`"
              class="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ExternalLink :size="15" /> {{ store.t('openVehicleCard') }}
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <FileText :size="16" class="text-blue-500" /> {{ store.t('inspectionNotes') }}
            </h3>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ report.notes || store.t('noAdditionalNotes') }}</p>
          </div>

          <div v-if="report.managerNote" class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Info :size="16" class="text-blue-500" /> {{ store.t('managersNote') }}
            </h3>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ report.managerNote }}</p>
          </div>

          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Info :size="16" class="text-blue-500" /> {{ store.t('inspectionSummary') }}
            </h3>

            <div v-if="report.responses.length" class="space-y-3">
              <article
                v-for="response in report.responses"
                :key="`${report.id}-${response.id}`"
                class="rounded-2xl border p-4"
                :class="response.state === 'fail'
                  ? 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20'
                  : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900/60'"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-gray-400">{{ response.section }}</p>
                    <h4 class="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{{ response.label }}</h4>
                  </div>
                  <span :class="responseBadge(response.state)">{{ responseLabel(response.state) }}</span>
                </div>

                <div v-if="response.note" class="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {{ response.note }}
                </div>

                <div v-if="response.photos.length" class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  <a
                    v-for="(photo, index) in response.photos"
                    :key="`${response.id}-${index}`"
                    :href="photo"
                    target="_blank"
                    rel="noreferrer"
                    class="group aspect-video overflow-hidden rounded-xl border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
                  >
                    <img :src="photo" :alt="response.label" class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                  </a>
                </div>
              </article>
            </div>

            <div v-else class="py-8 text-center text-sm text-gray-400">
              {{ store.t('noReportsFound') }}
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Info :size="16" class="text-blue-500" /> {{ store.t('basicInformation') }}
            </h3>
            <div class="space-y-3">
              <div v-for="item in basicInfo" :key="item.label" class="flex items-start justify-between gap-3 text-sm">
                <span class="text-gray-400">{{ item.label }}</span>
                <span class="text-right font-medium text-gray-900 dark:text-white">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <div v-if="failedResponses.length" class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <AlertTriangle :size="16" class="text-red-500" /> {{ store.t('failedItems') }}
            </h3>
            <div class="space-y-3">
              <div v-for="response in failedResponses" :key="`${response.id}-failed`" class="rounded-2xl bg-red-50/70 px-4 py-3 dark:bg-red-950/20">
                <p class="text-sm font-semibold text-red-700 dark:text-red-300">{{ response.label }}</p>
                <p class="mt-1 text-xs text-red-600/80 dark:text-red-300/80">{{ response.section }}</p>
                <p v-if="response.note" class="mt-2 text-sm text-red-700 dark:text-red-200">{{ response.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card p-12 text-center">
      <AlertTriangle :size="40" class="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">{{ store.t('noReportsFound') }}</p>
      <RouterLink :to="backRoute" class="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400">
        <ArrowLeft :size="14" /> {{ backLabel }}
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ExternalLink, FileText, Info, AlertTriangle } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchInspectionReportById, type InspectionReportDetailRecord, type InspectionReportResponseRecord } from '@/lib/inspectionReports'

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()

const localeMap: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  es: 'es-ES',
  fr: 'fr-FR',
}

const report = ref<InspectionReportDetailRecord | null>(null)
const reportLoading = ref(false)
const reportError = ref('')

const reportId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
const activeRole = computed(() => authStore.currentCompany?.role || authStore.profile?.role || null)
const backRoute = computed(() => activeRole.value === 'driver' ? '/driver/reports' : '/reports')
const backLabel = computed(() => activeRole.value === 'driver' ? store.t('myReports') : store.t('reports'))
const reportCode = computed(() => report.value ? `#${report.value.id.slice(0, 8).toUpperCase()}` : '')

function inspectionTypeLabel(type: InspectionReportDetailRecord['inspectionType']) {
  return type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
}

function resultLabel(result: InspectionReportDetailRecord['result']) {
  return result === 'pass' ? store.t('pass') : store.t('fail')
}

function reviewStatusText(status: InspectionReportDetailRecord['reviewStatus']) {
  if (status === 'needs-review') {
    return store.t('statusNeedsReview')
  }

  if (status === 'reviewed-ok') {
    return store.t('statusReviewedOk')
  }

  if (status === 'reviewed-flag') {
    return store.t('statusFlagged')
  }

  return '—'
}

function reviewStatusBadge(status: InspectionReportDetailRecord['reviewStatus']) {
  if (status === 'needs-review') {
    return 'badge-yellow'
  }

  if (status === 'reviewed-ok') {
    return 'badge-green'
  }

  return 'badge-red'
}

function responseLabel(state: InspectionReportResponseRecord['state']) {
  if (state === 'pass') {
    return store.t('pass')
  }

  if (state === 'fail') {
    return store.t('fail')
  }

  return '—'
}

function responseBadge(state: InspectionReportResponseRecord['state']) {
  if (state === 'pass') {
    return 'badge-green'
  }

  if (state === 'fail') {
    return 'badge-red'
  }

  return 'badge-gray'
}

const basicInfo = computed(() => report.value ? [
  { label: store.t('inspectionDate'), value: report.value.date },
  { label: store.t('reportedBy'), value: report.value.performedBy },
  { label: store.t('inspectionType'), value: inspectionTypeLabel(report.value.inspectionType) },
  { label: store.t('result'), value: resultLabel(report.value.result) },
  { label: store.t('status'), value: store.t('statusSubmitted') },
  { label: store.t('reviewStatus'), value: reviewStatusText(report.value.reviewStatus) },
  { label: store.t('issues'), value: String(report.value.issues) },
  { label: store.t('photos'), value: String(report.value.photos) },
] : [])

const failedResponses = computed(() => report.value ? report.value.responses.filter((response) => response.state === 'fail') : [])

async function loadReport(
  companyId = authStore.companyId,
  language = store.language,
  requestedReportId = reportId.value,
  role = authStore.role,
  userId = authStore.user?.id || null,
) {
  reportError.value = ''

  if (!companyId || !requestedReportId) {
    report.value = null
    return
  }

  reportLoading.value = true

  try {
    report.value = await fetchInspectionReportById(companyId, requestedReportId, {
      driverAuthUserId: role === 'driver' ? userId : null,
      locale: localeMap[language] || 'en-US',
    })
  } catch (loadError: any) {
    reportError.value = loadError?.message || store.t('unableToLoadReports')
    report.value = null
  } finally {
    reportLoading.value = false
  }
}

watch(
  [() => authStore.companyId, () => store.language, reportId, () => authStore.currentCompany?.role || authStore.profile?.role || null, () => authStore.user?.id || null],
  ([companyId, language, requestedReportId, role, userId]) => {
    void loadReport(companyId, language, requestedReportId, role, userId)
  },
  { immediate: true },
)
</script>

<style scoped>
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-gray { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300; }
</style>