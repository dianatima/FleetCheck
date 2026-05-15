<template>
  <AppLayout title="Issues">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
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
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Wrench } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()
const search = ref('')
const filterStatus = ref('all')
const filterSeverity = ref('all')
const filterFraud = ref('all')

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
const statusLabel = computed((): Record<string, string> => ({
  open:           store.t('statusOpen'),
  'under-review': store.t('statusUnderReview'),
  'in-repair':    store.t('statusInRepair'),
  fixed:          store.t('statusFixed'),
  rejected:       store.t('statusRejected'),
}))

const severityLabel = computed((): Record<string, string> => ({
  high:   store.t('priorityHigh'),
  medium: store.t('priorityMedium'),
  low:    store.t('priorityLow'),
}))

export interface Issue {
  id: number
  issueId: string
  vehicle: string
  vehicleStatus: string
  driver: string
  inspectionType: string
  inspectionDate: string
  title: string
  description: string
  checklistItem: string
  severity: string
  status: string
  fraudFlag: boolean
  managerNotes: string
  createdAt: string
  photos: string[]
}

const issues = ref<Issue[]>([
  {
    id: 1, issueId: 'ISS-001', vehicle: 'Peterbilt 579 #0781', vehicleStatus: 'needs-attention',
    driver: 'Maria Garcia', inspectionType: 'Pre-Trip', inspectionDate: 'May 12, 7:18 AM',
    title: 'Left turn signal not working', description: 'Turn signal activates but does not flash. Likely a faulty relay or bulb.',
    checklistItem: 'Lights & Signals', severity: 'high', status: 'open', fraudFlag: false,
    managerNotes: '', createdAt: 'May 12, 7:18 AM',
    photos: ['https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=300'],
  },
  {
    id: 2, issueId: 'ISS-002', vehicle: 'Kenworth T680 #1042', vehicleStatus: 'active',
    driver: 'John Smith', inspectionType: 'Pre-Trip', inspectionDate: 'May 11, 7:02 AM',
    title: 'Brake fluid level low', description: 'Brake fluid reservoir is below minimum. Requires immediate top-up and inspection for leaks.',
    checklistItem: 'Brakes', severity: 'high', status: 'under-review', fraudFlag: false,
    managerNotes: 'Scheduled for shop visit today.', createdAt: 'May 11, 7:02 AM',
    photos: [],
  },
  {
    id: 3, issueId: 'ISS-003', vehicle: 'Volvo VNL 860 #0521', vehicleStatus: 'blocked',
    driver: 'James Carter', inspectionType: 'Pre-Trip', inspectionDate: 'May 10, 8:00 AM',
    title: 'Oil pressure warning light on', description: 'Dashboard oil pressure warning illuminated during startup. Engine sounds normal but oil level is low.',
    checklistItem: 'Engine & Fluids', severity: 'high', status: 'in-repair', fraudFlag: false,
    managerNotes: 'Vehicle blocked. Tom Blake working on it.', createdAt: 'May 10, 8:00 AM',
    photos: ['https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=300'],
  },
  {
    id: 4, issueId: 'ISS-004', vehicle: 'Volvo VNL 860 #0521', vehicleStatus: 'blocked',
    driver: 'James Carter', inspectionType: 'Pre-Trip', inspectionDate: 'May 10, 8:00 AM',
    title: 'Windshield crack (driver side)', description: 'Crack approximately 30cm on driver-side windshield, impairing visibility.',
    checklistItem: 'Windshield & Wipers', severity: 'high', status: 'in-repair', fraudFlag: false,
    managerNotes: '', createdAt: 'May 10, 8:05 AM',
    photos: [],
  },
  {
    id: 5, issueId: 'ISS-005', vehicle: 'Volvo VNL 860 #0521', vehicleStatus: 'blocked',
    driver: 'James Carter', inspectionType: 'Pre-Trip', inspectionDate: 'May 10, 8:00 AM',
    title: 'Trailer coupling misalignment', description: 'Coupling pin does not seat properly. Suspicious given report was filed 2 hours after departure.',
    checklistItem: 'Coupling & Trailer', severity: 'high', status: 'under-review', fraudFlag: true,
    managerNotes: 'Possible false report. Reviewing security footage.', createdAt: 'May 10, 10:15 AM',
    photos: [],
  },
  {
    id: 6, issueId: 'ISS-006', vehicle: 'Kenworth T680 #1042', vehicleStatus: 'active',
    driver: 'John Smith', inspectionType: 'Post-Trip', inspectionDate: 'May 13, 6:15 PM',
    title: 'Minor scratch on rear bumper', description: 'Small surface scratch on rear bumper, paint not broken.',
    checklistItem: 'Exterior', severity: 'low', status: 'rejected', fraudFlag: false,
    managerNotes: 'Pre-existing cosmetic damage. Not actionable.', createdAt: 'May 13, 6:15 PM',
    photos: [],
  },
  {
    id: 7, issueId: 'ISS-007', vehicle: 'Ford F-350 #3305', vehicleStatus: 'active',
    driver: 'Sarah Johnson', inspectionType: 'Pre-Trip', inspectionDate: 'May 11, 7:10 AM',
    title: 'Brake pads worn below minimum', description: 'Front axle brake pads at 10% remaining, immediate replacement required.',
    checklistItem: 'Brakes', severity: 'high', status: 'in-repair', fraudFlag: false,
    managerNotes: 'Parts ordered, repair scheduled for May 15.', createdAt: 'May 11, 7:10 AM',
    photos: ['https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=300'],
  },
  {
    id: 8, issueId: 'ISS-008', vehicle: 'Freightliner Cascadia #2210', vehicleStatus: 'active',
    driver: 'David Lee', inspectionType: 'Pre-Trip', inspectionDate: 'May 13, 7:02 AM',
    title: 'DEF fluid low warning', description: 'Diesel Exhaust Fluid below 10%. Vehicle will derate if not refilled.',
    checklistItem: 'Engine & Fluids', severity: 'medium', status: 'fixed', fraudFlag: false,
    managerNotes: 'Refilled at depot before departure.', createdAt: 'May 13, 7:02 AM',
    photos: [],
  },
])

const summaryStats = computed(() => [
  { label: store.t('statusOpen'),        count: issues.value.filter(i => i.status === 'open').length,         color: 'text-red-600 dark:text-red-400' },
  { label: store.t('statusUnderReview'), count: issues.value.filter(i => i.status === 'under-review').length, color: 'text-yellow-600 dark:text-yellow-400' },
  { label: store.t('statusInRepair'),    count: issues.value.filter(i => i.status === 'in-repair').length,    color: 'text-orange-600 dark:text-orange-400' },
  { label: store.t('statusFixed'),       count: issues.value.filter(i => i.status === 'fixed').length,        color: 'text-green-600 dark:text-green-400' },
  { label: store.t('fraudFlagged'),      count: issues.value.filter(i => i.fraudFlag).length,                 color: 'text-red-600 dark:text-red-400' },
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
</script>

<style scoped>
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
</style>
