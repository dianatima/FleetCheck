<template>
  <AppLayout :title="store.t('issueDetails')">
    <RouterLink to="/issues" class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
      <ArrowLeft :size="16" /> {{ store.t('backToIssues') }}
    </RouterLink>

    <div v-if="issueLoading" class="card p-12 text-center text-sm text-gray-400">
      {{ store.t('loadingIssues') }}
    </div>

    <div v-else-if="issueError" class="card p-12 text-center text-sm text-red-500">
      {{ issueError }}
    </div>

    <div v-else-if="issue">
      <div class="card mb-5 overflow-hidden">
        <div class="border-b border-gray-100 p-5 dark:border-gray-700">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" :class="severityBg[issue.severity]">
                <AlertTriangle :size="22" :class="severityIcon[issue.severity]" />
              </div>
              <div>
                <div class="mb-1 flex items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{{ issue.issueId }}</span>
                  <span v-if="issue.fraudFlag" class="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <ShieldAlert :size="11" /> {{ store.t('fraudFlaggedLabel') }}
                  </span>
                </div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ issue.title }}</h2>
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ issue.vehicle }} · {{ issue.driver }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span :class="severityBadge[issue.severity]">{{ severityLabel[issue.severity] }}</span>
              <span :class="statusBadge[issue.status]">{{ statusLabel[issue.status] }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <RouterLink
            v-if="issue.vehicleId"
            :to="{ path: '/repairs', query: { create: '1', vehicleId: issue.vehicleId } }"
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            <Wrench :size="15" /> {{ store.t('repairRequests') }}
          </RouterLink>
          <RouterLink
            v-if="issue.vehicleId"
            :to="`/vehicles/${issue.vehicleId}`"
            class="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ExternalLink :size="15" /> {{ store.t('openVehicleCard') }}
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Info :size="16" class="text-blue-500" /> {{ store.t('basicInformation') }}
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <div v-for="item in basicInfo" :key="item.label" class="flex flex-col gap-0.5">
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ item.label }}</span>
                <span class="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                  <component v-if="item.icon" :is="item.icon" :size="13" class="flex-shrink-0 text-gray-400" />
                  {{ item.value }}
                </span>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <FileText :size="16" class="text-blue-500" /> {{ store.t('issueInformation') }}
            </h3>
            <div class="space-y-4">
              <div>
                <span class="mb-1 block text-xs text-gray-400">{{ store.t('issue') }}</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ issue.title }}</p>
              </div>
              <div>
                <span class="mb-1 block text-xs text-gray-400">{{ store.t('description') }}</span>
                <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ issue.description || issue.inspectionNotes || store.t('noAdditionalNotes') }}</p>
              </div>
              <div>
                <span class="mb-1 block text-xs text-gray-400">{{ store.t('checklistItem') }}</span>
                <span class="badge-blue">{{ issue.checklistItem }}</span>
              </div>
              <div v-if="issue.inspectionNotes && issue.inspectionNotes !== issue.description">
                <span class="mb-1 block text-xs text-gray-400">{{ store.t('inspectionNotes') }}</span>
                <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{{ issue.inspectionNotes }}</p>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Camera :size="16" class="text-blue-500" /> {{ store.t('photos') }}
            </h3>
            <div v-if="issue.photos.length > 0" class="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div v-for="(src, index) in issue.photos" :key="`${issue.id}-${index}`" class="aspect-video overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                <img :src="src" alt="" class="h-full w-full object-cover" />
              </div>
            </div>
            <div v-else class="py-8 text-center">
              <Camera :size="32" class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p class="text-sm text-gray-400">{{ store.t('noPhotosAttached') }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Clock :size="16" class="text-blue-500" /> {{ store.t('statusHistory') }}
            </h3>
            <div class="space-y-3">
              <div v-for="entry in statusHistory" :key="`${entry.date}-${entry.by}`" class="flex gap-3">
                <div class="flex flex-shrink-0 flex-col items-center gap-1">
                  <div class="mt-1.5 h-2 w-2 rounded-full" :class="entry.dot"></div>
                  <div class="w-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                </div>
                <div class="pb-3">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entry.action }}</p>
                  <p class="text-xs text-gray-400">{{ entry.date }} · {{ entry.by }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Truck :size="16" class="text-blue-500" /> {{ store.t('vehicle') }}
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between gap-3"><span class="text-gray-400">{{ store.t('vehicle') }}</span><span class="text-right font-medium text-gray-900 dark:text-white">{{ issue.vehicle }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-gray-400">{{ store.t('status') }}</span><span :class="vStatusBadge[issue.vehicleStatus]">{{ vStatusLabel[issue.vehicleStatus] || issue.vehicleStatus }}</span></div>
            </div>
            <RouterLink
              v-if="issue.vehicleId"
              :to="`/vehicles/${issue.vehicleId}`"
              class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ExternalLink :size="12" /> {{ store.t('openVehicleCard') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card p-12 text-center">
      <AlertTriangle :size="40" class="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">{{ store.t('issueNotFound') }}</p>
      <RouterLink to="/issues" class="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400">
        <ArrowLeft :size="14" /> {{ store.t('backToIssues') }}
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, AlertTriangle, ShieldAlert, FileText, Camera, Clock, Truck, Info, ExternalLink, Calendar, User, Hash, Wrench } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchInspectionIssueById, type InspectionIssueRecord } from '@/lib/inspectionIssues'

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()

const localeMap: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  es: 'es-ES',
  fr: 'fr-FR',
}

const issue = ref<InspectionIssueRecord | null>(null)
const issueLoading = ref(false)
const issueError = ref('')

const issueId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')

const severityBadge: Record<string, string> = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-gray' }
const severityBg: Record<string, string> = { high: 'bg-red-100 dark:bg-red-900/30', medium: 'bg-yellow-100 dark:bg-yellow-900/30', low: 'bg-gray-100 dark:bg-gray-700' }
const severityIcon: Record<string, string> = { high: 'text-red-600 dark:text-red-400', medium: 'text-yellow-600 dark:text-yellow-400', low: 'text-gray-400' }
const statusBadge: Record<string, string> = { open: 'badge-red', 'under-review': 'badge-yellow', 'in-repair': 'badge-orange', fixed: 'badge-green', rejected: 'badge-gray' }
const statusLabel = computed<Record<string, string>>(() => ({
  open: store.t('statusOpen'),
  'under-review': store.t('statusUnderReview'),
  'in-repair': store.t('statusInRepair'),
  fixed: store.t('statusFixed'),
  rejected: store.t('statusRejected'),
}))
const severityLabel = computed<Record<string, string>>(() => ({
  high: store.t('priorityHigh'),
  medium: store.t('priorityMedium'),
  low: store.t('priorityLow'),
}))
const vStatusBadge: Record<string, string> = { active: 'badge-green', 'needs-attention': 'badge-orange', blocked: 'badge-red', 'in-repair': 'badge-gray' }
const vStatusLabel = computed<Record<string, string>>(() => ({
  active: store.t('statusActive'),
  'needs-attention': store.t('statusNeedsAttention'),
  blocked: store.t('statusBlocked'),
  'in-repair': store.t('statusInRepair'),
}))

function getInspectionTypeLabel(type: InspectionIssueRecord['inspectionType']) {
  return type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
}

const basicInfo = computed(() => issue.value ? [
  { icon: Hash, label: store.t('issue'), value: issue.value.issueId },
  { icon: Truck, label: store.t('vehicle'), value: issue.value.vehicle },
  { icon: User, label: store.t('driver'), value: issue.value.driver },
  { icon: User, label: store.t('reportedBy'), value: issue.value.reportedBy },
  { icon: null, label: store.t('inspectionType'), value: getInspectionTypeLabel(issue.value.inspectionType) },
  { icon: Calendar, label: store.t('inspectionDate'), value: issue.value.inspectionDate },
  { icon: Calendar, label: store.t('issueDate'), value: issue.value.createdAt },
  { icon: null, label: store.t('checklistItem'), value: issue.value.checklistItem },
  { icon: null, label: store.t('currentStatus'), value: statusLabel.value[issue.value.status] },
] : [])

const statusHistory = computed(() => issue.value ? [{
  action: store.t('reportedInInspection'),
  date: issue.value.createdAt,
  by: issue.value.reportedBy,
  dot: 'bg-blue-500',
}] : [])

async function loadIssue(companyId = authStore.companyId, language = store.language, requestedIssueId = issueId.value) {
  issueError.value = ''

  if (!companyId || !requestedIssueId) {
    issue.value = null
    return
  }

  issueLoading.value = true

  try {
    issue.value = await fetchInspectionIssueById(companyId, requestedIssueId, {
      driverAuthUserId: authStore.role === 'driver' ? authStore.user?.id || null : null,
      locale: localeMap[language] || 'en-US',
    })
  } catch (loadError: any) {
    issueError.value = loadError?.message || store.t('unableToLoadIssues')
    issue.value = null
  } finally {
    issueLoading.value = false
  }
}

watch(
  [() => authStore.companyId, () => store.language, issueId],
  ([companyId, language, requestedIssueId]) => {
    void loadIssue(companyId, language, requestedIssueId)
  },
  { immediate: true },
)
</script>

<style scoped>
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.badge-blue   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
</style>
