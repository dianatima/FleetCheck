<template>
  <AppLayout :title="store.t('issueDetails')">
    <RouterLink to="/issues" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('backToIssues') }}
    </RouterLink>

    <div v-if="issue">
      <!-- Header card -->
      <div class="card overflow-hidden mb-5">
        <div class="p-5 border-b border-gray-100 dark:border-gray-700">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="severityBg[issue.severity]">
                <AlertTriangle :size="22" :class="severityIcon[issue.severity]" />
              </div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{{ issue.issueId }}</span>
                  <span v-if="issue.fraudFlag" class="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                    <ShieldAlert :size="11" /> {{ store.t('fraudFlaggedLabel') }}
                  </span>
                </div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ issue.title }}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ issue.vehicle }} · {{ issue.driver }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span :class="severityBadge[issue.severity]">{{ issue.severity }}</span>
              <span :class="statusBadge[issue.status]">{{ statusLabel[issue.status] }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700">
          <button
            @click="performAction('in-repair')"
            :disabled="issue.status === 'fixed' || issue.status === 'rejected' || issue.status === 'in-repair'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Wrench :size="15" /> {{ store.t('sendToRepair') }}
          </button>
          <button
            @click="performAction('rejected')"
            :disabled="issue.status === 'fixed' || issue.status === 'rejected'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gray-600 hover:bg-gray-700 text-white"
          >
            <XCircle :size="15" /> {{ store.t('rejectIssue') }}
          </button>
          <button
            @click="blockVehicle"
            :disabled="issue.vehicleStatus === 'blocked'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
          >
            <Ban :size="15" /> {{ issue.vehicleStatus === 'blocked' ? store.t('vehicleBlockedLabel') : store.t('blockVehicle') }}
          </button>
          <button
            @click="performAction('fixed')"
            :disabled="issue.status === 'fixed' || issue.status === 'rejected'"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle :size="15" /> {{ store.t('markAsFixed') }}
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-5">
        <!-- Left: main info -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Basic information -->
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Info :size="16" class="text-blue-500" /> {{ store.t('basicInformation') }}
            </h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div v-for="item in basicInfo" :key="item.label" class="flex flex-col gap-0.5">
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ item.label }}</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                  <component v-if="item.icon" :is="item.icon" :size="13" class="text-gray-400 flex-shrink-0" />
                  {{ item.value }}
                </span>
              </div>
            </div>
          </div>

          <!-- Issue Information -->
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <FileText :size="16" class="text-blue-500" /> {{ store.t('issueInformation') }}
            </h3>
            <div class="space-y-4">
              <div>
                <span class="text-xs text-gray-400 block mb-1">{{ store.t('repairTitle') }}</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ issue.title }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1">{{ store.t('description') }}</span>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ issue.description }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1">Checklist Item</span>
                <span class="badge-blue">{{ issue.checklistItem }}</span>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1">{{ store.t('managerNotes') }}</span>
                <textarea
                  v-model="issue.managerNotes"
                  class="input-field resize-none text-sm"
                  rows="3"
                  placeholder="Add manager notes..."
                  @blur="saveNotes"
                />
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Camera :size="16" class="text-blue-500" /> {{ store.t('photos') }}
            </h3>
            <div v-if="issue.photos.length > 0" class="grid grid-cols-3 gap-3">
              <div v-for="(src, i) in issue.photos" :key="i" class="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity">
                <img :src="src" alt="" class="w-full h-full object-cover" />
              </div>
            </div>
            <div v-else class="py-8 text-center">
              <Camera :size="32" class="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p class="text-sm text-gray-400">{{ store.t('noPhotosAttached') }}</p>
            </div>
          </div>
        </div>

        <!-- Right: sidebar info -->
        <div class="space-y-5">
          <!-- Status history -->
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Clock :size="16" class="text-blue-500" /> {{ store.t('statusHistory') }}
            </h3>
            <div class="space-y-3">
              <div v-for="e in statusHistory" :key="e.date" class="flex gap-3">
                <div class="flex flex-col items-center gap-1 flex-shrink-0">
                  <div class="w-2 h-2 rounded-full mt-1.5" :class="e.dot"></div>
                  <div class="w-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                </div>
                <div class="pb-3">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ e.action }}</p>
                  <p class="text-xs text-gray-400">{{ e.date }} · {{ e.by }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle quick info -->
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Truck :size="16" class="text-blue-500" /> {{ store.t('vehicle') }}
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-400">{{ store.t('unit') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ issue.vehicle }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">{{ store.t('status') }}</span>
                <span :class="vStatusBadge[issue.vehicleStatus]">{{ vStatusLabel[issue.vehicleStatus] }}</span>
              </div>
            </div>
            <RouterLink :to="`/vehicles/1`" class="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ExternalLink :size="12" /> {{ store.t('openVehicleCard') }}
            </RouterLink>
          </div>

          <!-- Confirm action modal trigger info -->
          <div v-if="lastAction" class="card p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
            <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle :size="16" />
              <span class="text-sm font-medium">{{ lastAction }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="card p-12 text-center">
      <AlertTriangle :size="40" class="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-gray-500 dark:text-gray-400">{{ store.t('issueNotFound') }}</p>
      <RouterLink to="/issues" class="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline">
        <ArrowLeft :size="14" /> {{ store.t('backToIssues') }}
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, AlertTriangle, Wrench, XCircle, CheckCircle, Ban, ShieldAlert, FileText, Camera, Clock, Truck, Info, ExternalLink, Calendar, User, Hash } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'

const route = useRoute()
const store = useAppStore()
const id = Number(route.params.id)
const lastAction = ref('')

const severityBadge: Record<string, string> = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-gray' }
const severityBg:   Record<string, string> = { high: 'bg-red-100 dark:bg-red-900/30', medium: 'bg-yellow-100 dark:bg-yellow-900/30', low: 'bg-gray-100 dark:bg-gray-700' }
const severityIcon: Record<string, string> = { high: 'text-red-600 dark:text-red-400', medium: 'text-yellow-600 dark:text-yellow-400', low: 'text-gray-400' }
const statusBadge:  Record<string, string> = { open: 'badge-red', 'under-review': 'badge-yellow', 'in-repair': 'badge-orange', fixed: 'badge-green', rejected: 'badge-gray' }
const statusLabel = computed((): Record<string, string> => ({
  open:           store.t('statusOpen'),
  'under-review': store.t('statusUnderReview'),
  'in-repair':    store.t('statusInRepair'),
  fixed:          store.t('statusFixed'),
  rejected:       store.t('statusRejected'),
}))
const vStatusBadge: Record<string, string> = { active: 'badge-green', 'needs-attention': 'badge-orange', blocked: 'badge-red', 'in-repair': 'badge-gray' }
const vStatusLabel = computed((): Record<string, string> => ({
  active:            store.t('statusActive'),
  'needs-attention': store.t('statusNeedsAttention'),
  blocked:           store.t('statusBlocked'),
  'in-repair':       store.t('statusInRepair'),
}))

const allIssues = ref([
  { id: 1, issueId: 'ISS-001', vehicle: 'Peterbilt 579 #0781',    vehicleStatus: 'needs-attention', driver: 'Maria Garcia',  inspectionType: 'Pre-Trip',  inspectionDate: 'May 12, 7:18 AM',  title: 'Left turn signal not working',    description: 'Turn signal activates but does not flash. Likely a faulty relay or bulb.',                                          checklistItem: 'Lights & Signals',    severity: 'high',     status: 'open',         fraudFlag: false, managerNotes: '',                                              createdAt: 'May 12, 7:18 AM', photos: ['https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=400'] },
  { id: 2, issueId: 'ISS-002', vehicle: 'Kenworth T680 #1042',     vehicleStatus: 'active',          driver: 'John Smith',    inspectionType: 'Pre-Trip',  inspectionDate: 'May 11, 7:02 AM',  title: 'Brake fluid level low',           description: 'Brake fluid reservoir is below minimum. Requires immediate top-up and inspection for leaks.',                       checklistItem: 'Brakes',              severity: 'high', status: 'under-review', fraudFlag: false, managerNotes: 'Scheduled for shop visit today.',               createdAt: 'May 11, 7:02 AM', photos: [] },
  { id: 3, issueId: 'ISS-003', vehicle: 'Volvo VNL 860 #0521',     vehicleStatus: 'blocked',         driver: 'James Carter',  inspectionType: 'Pre-Trip',  inspectionDate: 'May 10, 8:00 AM',  title: 'Oil pressure warning light on',   description: 'Dashboard oil pressure warning illuminated during startup. Engine sounds normal but oil level is low.',             checklistItem: 'Engine & Fluids',     severity: 'high', status: 'in-repair',    fraudFlag: false, managerNotes: 'Vehicle blocked. Tom Blake working on it.',     createdAt: 'May 10, 8:00 AM', photos: ['https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=400'] },
  { id: 4, issueId: 'ISS-004', vehicle: 'Volvo VNL 860 #0521',     vehicleStatus: 'blocked',         driver: 'James Carter',  inspectionType: 'Pre-Trip',  inspectionDate: 'May 10, 8:00 AM',  title: 'Windshield crack (driver side)',  description: 'Crack approximately 30cm on driver-side windshield, impairing visibility.',                                        checklistItem: 'Windshield & Wipers', severity: 'high',     status: 'in-repair',    fraudFlag: false, managerNotes: '',                                              createdAt: 'May 10, 8:05 AM', photos: [] },
  { id: 5, issueId: 'ISS-005', vehicle: 'Volvo VNL 860 #0521',     vehicleStatus: 'blocked',         driver: 'James Carter',  inspectionType: 'Pre-Trip',  inspectionDate: 'May 10, 8:00 AM',  title: 'Trailer coupling misalignment',   description: 'Coupling pin does not seat properly. Suspicious — report was filed 2 hours after departure.',                     checklistItem: 'Coupling & Trailer',  severity: 'high', status: 'under-review', fraudFlag: true,  managerNotes: 'Possible false report. Reviewing security footage.', createdAt: 'May 10, 10:15 AM', photos: [] },
  { id: 6, issueId: 'ISS-006', vehicle: 'Kenworth T680 #1042',     vehicleStatus: 'active',          driver: 'John Smith',    inspectionType: 'Post-Trip', inspectionDate: 'May 13, 6:15 PM',  title: 'Minor scratch on rear bumper',    description: 'Small surface scratch on rear bumper, paint not broken.',                                                          checklistItem: 'Exterior',            severity: 'low',      status: 'rejected',     fraudFlag: false, managerNotes: 'Pre-existing cosmetic damage. Not actionable.', createdAt: 'May 13, 6:15 PM', photos: [] },
  { id: 7, issueId: 'ISS-007', vehicle: 'Ford F-350 #3305',         vehicleStatus: 'active',          driver: 'Sarah Johnson', inspectionType: 'Pre-Trip',  inspectionDate: 'May 11, 7:10 AM',  title: 'Brake pads worn below minimum',   description: 'Front axle brake pads at 10% remaining, immediate replacement required.',                                          checklistItem: 'Brakes',              severity: 'high',     status: 'in-repair',    fraudFlag: false, managerNotes: 'Parts ordered, repair scheduled for May 15.',   createdAt: 'May 11, 7:10 AM', photos: ['https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=400'] },
  { id: 8, issueId: 'ISS-008', vehicle: 'Freightliner Cascadia #2210', vehicleStatus: 'active',      driver: 'David Lee',     inspectionType: 'Pre-Trip',  inspectionDate: 'May 13, 7:02 AM',  title: 'DEF fluid low warning',           description: 'Diesel Exhaust Fluid below 10%. Vehicle will derate if not refilled.',                                              checklistItem: 'Engine & Fluids',     severity: 'medium',   status: 'fixed',        fraudFlag: false, managerNotes: 'Refilled at depot before departure.',           createdAt: 'May 13, 7:02 AM', photos: [] },
])

const issue = computed(() => allIssues.value.find(i => i.id === id) ?? null)

const basicInfo = computed(() => issue.value ? [
  { icon: Hash,     label: store.t('issue'),          value: issue.value.issueId },
  { icon: Truck,    label: store.t('vehicle'),         value: issue.value.vehicle },
  { icon: null,     label: store.t('currentStatus'),   value: vStatusLabel.value[issue.value.vehicleStatus] },
  { icon: User,     label: store.t('driver'),          value: issue.value.driver },
  { icon: null,     label: store.t('inspectionType'),  value: issue.value.inspectionType },
  { icon: Calendar, label: store.t('inspectionDate'),  value: issue.value.inspectionDate },
  { icon: Calendar, label: store.t('issueDate'),       value: issue.value.createdAt },
  { icon: null,     label: store.t('severity'),        value: issue.value.severity },
  { icon: null,     label: store.t('status'),          value: statusLabel.value[issue.value.status] },
] : [])

const statusHistory = computed(() => {
  if (!issue.value) return []
  const base = [{ action: 'Issue created', date: issue.value.createdAt, by: issue.value.driver, dot: 'bg-blue-500' }]
  if (issue.value.status !== 'open') base.push({ action: statusLabel.value[issue.value.status], date: 'May 14', by: 'James Davis', dot: 'bg-green-500' })
  return base.reverse()
})

function performAction(newStatus: string) {
  if (!issue.value) return
  const idx = allIssues.value.findIndex(i => i.id === id)
  if (idx !== -1) {
    allIssues.value[idx].status = newStatus
    const labels: Record<string, string> = { 'in-repair': 'Sent to Repair', rejected: 'Issue Rejected', fixed: 'Marked as Fixed' }
    lastAction.value = labels[newStatus] ?? 'Status updated'
    setTimeout(() => { lastAction.value = '' }, 3000)
  }
}

function blockVehicle() {
  if (!issue.value) return
  const idx = allIssues.value.findIndex(i => i.id === id)
  if (idx !== -1) {
    allIssues.value[idx].vehicleStatus = 'blocked'
    lastAction.value = 'Vehicle blocked'
    setTimeout(() => { lastAction.value = '' }, 3000)
  }
}

function saveNotes() {
  // In real app: persist to DB
}
</script>

<style scoped>
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.badge-blue   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
</style>
