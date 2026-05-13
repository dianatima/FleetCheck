<template>
  <AppLayout title="Reports &amp; Compliance">
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
          <option value="all">All Types</option>
          <option value="Pre-Trip">Pre-Trip</option>
          <option value="Post-Trip">Post-Trip</option>
        </select>
        <select v-model="filterResult" class="input-field py-1.5 text-sm flex-1">
          <option value="all">All Results</option>
          <option value="pass">Passed</option>
          <option value="fail">Failed</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <input type="date" class="input-field py-1.5 text-sm" value="2026-05-10" />
        <span class="text-gray-400 text-sm">—</span>
        <input type="date" class="input-field py-1.5 text-sm" value="2026-05-12" />
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary gap-1.5 text-sm py-2"><Download :size="14" /> PDF</button>
        <button class="btn-secondary gap-1.5 text-sm py-2"><Download :size="14" /> CSV</button>
        <button class="btn-secondary gap-1.5 text-sm py-2"><Mail :size="14" /> Email</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in headers" :key="h" class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
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
                  <span :class="r.result === 'pass' ? 'badge-green' : 'badge-red'" class="text-xs">{{ r.result === 'pass' ? 'Pass' : 'Fail' }}</span>
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
                <div class="flex gap-1">
                  <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><FileText :size="13" /></button>
                  <button class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><Download :size="13" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400">Showing {{ filtered.length }} of {{ reports.length }} reports</span>
        <div class="flex gap-1">
          <button v-for="p in 3" :key="p" class="w-7 h-7 rounded-lg text-xs font-medium transition-colors" :class="p === 1 ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'">{{ p }}</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, Download, Mail, Truck, CheckCircle, XCircle, Camera, FileText } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'

const filterType = ref('all')
const filterResult = ref('all')

const headers = ['Date', 'Vehicle', 'Driver', 'Type', 'Result', 'Issues', 'Photos', 'Signature', 'Actions']

const reports = [
  { id: 1, date: 'May 12, 7:24 AM', vehicle: 'Kenworth T680 #1042', driver: 'John Smith', type: 'Pre-Trip', result: 'pass', issues: 0, photos: 3, signed: true },
  { id: 2, date: 'May 12, 7:18 AM', vehicle: 'Peterbilt 579 #0781', driver: 'Maria Garcia', type: 'Pre-Trip', result: 'fail', issues: 2, photos: 5, signed: true },
  { id: 3, date: 'May 11, 6:55 PM', vehicle: 'Freightliner #2210', driver: 'David Lee', type: 'Post-Trip', result: 'pass', issues: 0, photos: 1, signed: true },
  { id: 4, date: 'May 11, 6:42 AM', vehicle: 'Ford F-350 #3305', driver: 'Sarah Johnson', type: 'Pre-Trip', result: 'pass', issues: 0, photos: 2, signed: true },
  { id: 5, date: 'May 11, 7:02 AM', vehicle: 'Kenworth T680 #1042', driver: 'John Smith', type: 'Pre-Trip', result: 'fail', issues: 1, photos: 4, signed: true },
  { id: 6, date: 'May 10, 6:45 PM', vehicle: 'Ford F-350 #3305', driver: 'Sarah Johnson', type: 'Post-Trip', result: 'pass', issues: 0, photos: 0, signed: true },
  { id: 7, date: 'May 10, 8:00 AM', vehicle: 'Volvo VNL #0521', driver: 'James Carter', type: 'Pre-Trip', result: 'fail', issues: 3, photos: 6, signed: true },
  { id: 8, date: 'May 10, 7:15 AM', vehicle: 'Genie S-65 #1099', driver: 'Mike Brown', type: 'Pre-Trip', result: 'pass', issues: 0, photos: 2, signed: true },
]

const passCount = computed(() => reports.filter(r => r.result === 'pass').length)
const failCount = computed(() => reports.filter(r => r.result === 'fail').length)

const summaryStats = computed(() => [
  { label: 'Total Reports', value: reports.length, color: 'text-gray-900 dark:text-white' },
  { label: 'Passed', value: passCount.value, color: 'text-green-600 dark:text-green-400' },
  { label: 'Failed', value: failCount.value, color: 'text-red-600 dark:text-red-400' },
  { label: 'Pass Rate', value: `${Math.round((passCount.value / reports.length) * 100)}%`, color: 'text-blue-600 dark:text-blue-400' },
])

const filtered = computed(() => reports.filter(r => {
  const matchType = filterType.value === 'all' || r.type === filterType.value
  const matchResult = filterResult.value === 'all' || r.result === filterResult.value
  return matchType && matchResult
}))
</script>
