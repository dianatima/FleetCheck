<template>
  <AppLayout title="My Reports">
    <!-- Summary bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in driverReportHeaders" :key="h"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="9" class="text-center py-12 text-sm text-gray-400">{{ store.t('noReportsFound') }}</td>
            </tr>
            <tr v-for="r in filtered" :key="r.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
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
                <span v-else class="text-gray-400 text-xs">No</span>
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
                      @click="editReport(r)"
                      title="Edit draft"
                      class="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                      <Pencil :size="13" />
                    </button>
                    <button
                      @click="submitReport(r)"
                      title="Submit report"
                      class="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <Send :size="13" />
                    </button>
                  </template>
                  <template v-else>
                    <button
                      title="View report"
                      class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <FileText :size="13" />
                    </button>
                    <button
                      title="Download PDF"
                      class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <Download :size="13" />
                    </button>
                  </template>
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
import { ref, computed } from 'vue'
import { Filter, Download, Truck, CheckCircle, XCircle, Camera, FileText, Pencil, Send, File as FileEdit } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const filterType = ref('all')
const filterResult = ref('all')

interface Report {
  id: number
  date: string
  vehicle: string
  type: string
  result: string
  issues: number
  photos: number
  signed: boolean
  status: 'draft' | 'submitted'
}

const reports = ref<Report[]>([
  { id: 1, date: 'May 14, 7:24 AM', vehicle: 'Kenworth T680 #1042', type: 'Pre-Trip',  result: 'pass', issues: 0, photos: 3, signed: true,  status: 'submitted' },
  { id: 2, date: 'May 13, 6:15 PM', vehicle: 'Kenworth T680 #1042', type: 'Post-Trip', result: 'pass', issues: 0, photos: 1, signed: true,  status: 'submitted' },
  { id: 3, date: 'May 13, 7:02 AM', vehicle: 'Freightliner #2210',  type: 'Pre-Trip',  result: 'fail', issues: 1, photos: 4, signed: true,  status: 'submitted' },
  { id: 4, date: 'May 12, 6:45 PM', vehicle: 'Kenworth T680 #1042', type: 'Post-Trip', result: 'pass', issues: 0, photos: 0, signed: false, status: 'draft' },
  { id: 5, date: 'May 12, 7:15 AM', vehicle: 'Kenworth T680 #1042', type: 'Pre-Trip',  result: 'pass', issues: 0, photos: 2, signed: false, status: 'draft' },
  { id: 6, date: 'May 11, 6:30 PM', vehicle: 'Ford F-350 #3305',    type: 'Post-Trip', result: 'pass', issues: 0, photos: 1, signed: true,  status: 'submitted' },
  { id: 7, date: 'May 11, 7:10 AM', vehicle: 'Ford F-350 #3305',    type: 'Pre-Trip',  result: 'fail', issues: 2, photos: 5, signed: true,  status: 'submitted' },
])

function editReport(r: Report) {
  alert(`Edit draft report #${r.id}`)
}

function submitReport(r: Report) {
  if (confirm(`Submit report for ${r.vehicle} (${r.date})?`)) {
    r.status = 'submitted'
    r.signed = true
  }
}

const passCount = computed(() => reports.value.filter(r => r.result === 'pass').length)
const failCount = computed(() => reports.value.filter(r => r.result === 'fail').length)

const summaryStats = computed(() => [
  { label: store.t('reports'), value: reports.value.length, color: 'text-gray-900 dark:text-white' },
  { label: store.t('statusPassed'), value: passCount.value, color: 'text-green-600 dark:text-green-400' },
  { label: store.t('statusFailed'), value: failCount.value, color: 'text-red-600 dark:text-red-400' },
  { label: 'Pass Rate', value: `${Math.round((passCount.value / reports.value.length) * 100)}%`, color: 'text-blue-600 dark:text-blue-400' },
])

const driverReportHeaders = computed(() => [store.t('date'), store.t('vehicle'), store.t('type'), store.t('result'), store.t('issues'), store.t('photos'), store.t('signature'), store.t('status'), store.t('actions')])

const filtered = computed(() => reports.value.filter(r => {
  const matchType   = filterType.value   === 'all' || r.type   === filterType.value
  const matchResult = filterResult.value === 'all' || r.result === filterResult.value
  return matchType && matchResult
}))
</script>
