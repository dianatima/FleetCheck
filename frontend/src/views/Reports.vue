<template>
  <AppLayout title="Reports &amp; Compliance">
    <!-- Summary bar -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.value }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <!-- Filters -->
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
          <option value="needs-review">{{ store.t('statusNeedsReview') }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <input type="date" class="input-field py-1.5 text-sm" value="2026-05-10" />
        <span class="text-gray-400 text-sm">—</span>
        <input type="date" class="input-field py-1.5 text-sm" value="2026-05-14" />
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary gap-1.5 text-sm py-2"><Download :size="14" /> {{ store.t('pdf') }}</button>
        <button class="btn-secondary gap-1.5 text-sm py-2"><Download :size="14" /> {{ store.t('csv') }}</button>
        <button class="btn-secondary gap-1.5 text-sm py-2"><Mail :size="14" /> {{ store.t('email') }}</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in reportHeaders" :key="h"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              :class="r.reviewStatus === 'needs-review' ? 'bg-yellow-50/40 dark:bg-yellow-900/5' : ''">
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ r.date }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <Truck :size="13" class="text-gray-400 flex-shrink-0" />
                  <span class="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ r.vehicle }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.driver }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.type }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <CheckCircle v-if="r.result === 'pass'" :size="13" class="text-green-500" />
                  <XCircle v-else :size="13" class="text-red-500" />
                  <span :class="r.result === 'pass' ? 'badge-green' : 'badge-red'" class="text-xs">{{ r.result === 'pass' ? store.t('pass') : store.t('fail') }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span v-if="r.reviewStatus === 'needs-review'" class="badge-yellow">{{ store.t('statusNeedsReview') }}</span>
                <span v-else-if="r.reviewStatus === 'reviewed-ok'" class="badge-green">{{ store.t('statusReviewedOk') }}</span>
                <span v-else-if="r.reviewStatus === 'reviewed-flag'" class="badge-red">{{ store.t('statusFlagged') }}</span>
                <span v-else class="text-xs text-gray-400">—</span>
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
                <div class="flex gap-1">
                  <button v-if="r.reviewStatus === 'needs-review'" @click="openReview(r)"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors whitespace-nowrap">
                    <ClipboardCheck :size="12" /> Review
                  </button>
                  <button @click="openReview(r)" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><FileText :size="13" /></button>
                  <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><Download :size="13" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('showing') }} {{ filtered.length }} {{ store.t('of') }} {{ reports.length }}</span>
        <div class="flex gap-1">
          <button v-for="p in 3" :key="p" class="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
            :class="p === 1 ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'">{{ p }}</button>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="reviewTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="reviewTarget = null" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ store.t('reviewInspection') }}</h2>
              <button @click="reviewTarget = null" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X :size="18" /></button>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                <div><span class="text-gray-400 text-xs block">{{ store.t('vehicle') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ reviewTarget?.vehicle }}</span></div>
                <div><span class="text-gray-400 text-xs block">{{ store.t('driver') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ reviewTarget?.driver }}</span></div>
                <div><span class="text-gray-400 text-xs block">{{ store.t('date') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ reviewTarget?.date }}</span></div>
                <div><span class="text-gray-400 text-xs block">{{ store.t('type') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ reviewTarget?.type }}</span></div>
                <div><span class="text-gray-400 text-xs block">{{ store.t('result') }}</span><span :class="reviewTarget?.result === 'pass' ? 'badge-green' : 'badge-red'">{{ reviewTarget?.result === 'pass' ? store.t('pass') : store.t('fail') }}</span></div>
                <div><span class="text-gray-400 text-xs block">{{ store.t('issues') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ reviewTarget?.issues ?? 0 }}</span></div>
              </div>
              <div>
                <label class="label">{{ store.t('managersDecision') }}</label>
                <div class="grid grid-cols-2 gap-3 mt-1">
                  <button type="button" @click="reviewDecision = 'reviewed-ok'"
                    class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                    :class="reviewDecision === 'reviewed-ok' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400'">
                    <CheckCircle :size="16" /> {{ store.t('approveOk') }}
                  </button>
                  <button type="button" @click="reviewDecision = 'reviewed-flag'"
                    class="flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                    :class="reviewDecision === 'reviewed-flag' ? 'bg-red-600 border-red-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-400'">
                    <AlertTriangle :size="16" /> {{ store.t('flagIssue') }}
                  </button>
                </div>
              </div>
              <div>
                <label class="label">{{ store.t('managersNote') }}</label>
                <textarea v-model="reviewNote" class="input-field resize-none" rows="3" placeholder="Add a note about this inspection..." />
              </div>
            </div>
            <div class="flex gap-3 px-6 pb-6">
              <button @click="reviewTarget = null" class="btn-secondary flex-1">{{ store.t('cancel') }}</button>
              <button @click="submitReview" :disabled="!reviewDecision" class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">{{ store.t('saveReview') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, Download, Mail, Truck, CheckCircle, XCircle, Camera, FileText, ClipboardCheck, AlertTriangle, X } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const filterType = ref('all')
const filterResult = ref('all')

interface Report { id: number; date: string; vehicle: string; driver: string; type: string; result: string; issues: number; photos: number; signed: boolean; reviewStatus: string; managerNote: string }

const reports = ref<Report[]>([
  { id: 1, date: 'May 12, 7:24 AM', vehicle: 'Kenworth T680 #1042', driver: 'John Smith',    type: 'Pre-Trip',  result: 'pass', issues: 0, photos: 3, signed: true, reviewStatus: '',             managerNote: '' },
  { id: 2, date: 'May 12, 7:18 AM', vehicle: 'Peterbilt 579 #0781', driver: 'Maria Garcia',  type: 'Pre-Trip',  result: 'fail', issues: 2, photos: 5, signed: true, reviewStatus: 'needs-review', managerNote: '' },
  { id: 3, date: 'May 11, 6:55 PM', vehicle: 'Freightliner #2210',  driver: 'David Lee',     type: 'Post-Trip', result: 'pass', issues: 0, photos: 1, signed: true, reviewStatus: '',             managerNote: '' },
  { id: 4, date: 'May 11, 6:42 AM', vehicle: 'Ford F-350 #3305',    driver: 'Sarah Johnson', type: 'Pre-Trip',  result: 'pass', issues: 0, photos: 2, signed: true, reviewStatus: '',             managerNote: '' },
  { id: 5, date: 'May 11, 7:02 AM', vehicle: 'Kenworth T680 #1042', driver: 'John Smith',    type: 'Pre-Trip',  result: 'fail', issues: 1, photos: 4, signed: true, reviewStatus: 'needs-review', managerNote: '' },
  { id: 6, date: 'May 10, 6:45 PM', vehicle: 'Ford F-350 #3305',    driver: 'Sarah Johnson', type: 'Post-Trip', result: 'pass', issues: 0, photos: 0, signed: true, reviewStatus: '',             managerNote: '' },
  { id: 7, date: 'May 10, 8:00 AM', vehicle: 'Volvo VNL #0521',     driver: 'James Carter',  type: 'Pre-Trip',  result: 'fail', issues: 3, photos: 6, signed: true, reviewStatus: 'needs-review', managerNote: '' },
  { id: 8, date: 'May 10, 7:15 AM', vehicle: 'Genie S-65 #1099',    driver: 'Mike Brown',    type: 'Pre-Trip',  result: 'pass', issues: 0, photos: 2, signed: true, reviewStatus: '',             managerNote: '' },
])

const passCount = computed(() => reports.value.filter(r => r.result === 'pass').length)
const failCount = computed(() => reports.value.filter(r => r.result === 'fail').length)
const reviewCount = computed(() => reports.value.filter(r => r.reviewStatus === 'needs-review').length)

const summaryStats = computed(() => [
  { label: store.t('reports'), value: reports.value.length, color: 'text-gray-900 dark:text-white' },
  { label: store.t('statusPassed'), value: passCount.value, color: 'text-green-600 dark:text-green-400' },
  { label: store.t('statusFailed'), value: failCount.value, color: 'text-red-600 dark:text-red-400' },
  { label: store.t('statusNeedsReview'), value: reviewCount.value, color: 'text-yellow-600 dark:text-yellow-400' },
  { label: 'Pass Rate', value: `${Math.round((passCount.value / reports.value.length) * 100)}%`, color: 'text-blue-600 dark:text-blue-400' },
])

const reportHeaders = computed(() => [store.t('date'), store.t('vehicle'), store.t('driver'), store.t('type'), store.t('result'), store.t('reviewStatus'), store.t('issues'), store.t('photos'), store.t('actions')])

const filtered = computed(() => reports.value.filter(r => {
  const matchType = filterType.value === 'all' || r.type === filterType.value
  const matchResult = filterResult.value === 'all'
    || (filterResult.value === 'needs-review' && r.reviewStatus === 'needs-review')
    || (filterResult.value !== 'needs-review' && r.result === filterResult.value)
  return matchType && matchResult
}))

const reviewTarget = ref<Report | null>(null)
const reviewDecision = ref('')
const reviewNote = ref('')

function openReview(r: Report) { reviewTarget.value = r; reviewDecision.value = r.reviewStatus !== 'needs-review' ? r.reviewStatus : ''; reviewNote.value = r.managerNote }

function submitReview() {
  if (!reviewTarget.value || !reviewDecision.value) return
  const idx = reports.value.findIndex(r => r.id === reviewTarget.value!.id)
  if (idx !== -1) { reports.value[idx].reviewStatus = reviewDecision.value; reports.value[idx].managerNote = reviewNote.value }
  reviewTarget.value = null; reviewDecision.value = ''; reviewNote.value = ''
}
</script>

<style scoped>
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
