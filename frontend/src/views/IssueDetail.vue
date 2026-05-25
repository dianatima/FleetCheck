<template>
  <AppLayout title="Issue Details">
    <RouterLink to="/issues" class="back-link">
      <ArrowLeft :size="16" /> {{ store.t('backToIssues') }}
    </RouterLink>

    <div v-if="loading" class="card p-6 text-sm text-gray-500">Loading issue...</div>
    <div v-else-if="error" class="card p-6 text-sm text-red-500">{{ error }}</div>
    <div v-else-if="issue">
      <div class="card overflow-hidden mb-5">
        <div class="p-5 border-b border-gray-100 dark:border-gray-700">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle :size="22" class="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span class="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">{{ issueNumber }}</span>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mt-1">{{ issue.title || 'Inspection issue' }}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ vehicleLabel }} · {{ driverLabel }}</p>
              </div>
            </div>
            <span :class="statusBadge[issue.status] || 'badge-gray'">{{ statusText(issue.status) }}</span>
          </div>
        </div>

        <div v-if="showManagerActions" class="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700">
          <button
            v-if="canSendToRepair"
            @click="sendToRepair"
            :disabled="busy"
            class="action-btn bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Wrench :size="15" /> {{ store.t('sendToRepair') }}
          </button>
          <button
            v-if="canRejectIssue"
            @click="rejectIssue"
            :disabled="busy"
            class="action-btn bg-gray-600 hover:bg-gray-700 text-white"
          >
            <XCircle :size="15" /> {{ store.t('rejectIssue') }}
          </button>
          <button
            v-if="canBlockVehicle"
            @click="markVehicleBlocked"
            :disabled="busy"
            class="action-btn bg-red-600 hover:bg-red-700 text-white"
          >
            <Ban :size="15" /> {{ store.t('blockVehicle') }}
          </button>
          <button
            v-if="canMarkFixed"
            @click="markIssueFixed"
            :disabled="busy"
            class="action-btn bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle :size="15" /> {{ store.t('markAsFixed') }}
          </button>
        </div>

        <div v-else-if="canManage && isTerminalIssue" class="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <span :class="statusBadge[issue.status] || 'badge-gray'">{{ statusText(issue.status) }}</span>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ terminalStatusMessage }}
          </p>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 space-y-5">
          <div class="card p-5">
            <h3 class="section-title"><Info :size="16" class="text-blue-500" /> {{ store.t('basicInformation') }}</h3>
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

          <div class="card p-5">
            <h3 class="section-title"><FileText :size="16" class="text-blue-500" /> {{ store.t('issueInformation') }}</h3>
            <div class="space-y-4">
              <div>
                <span class="text-xs text-gray-400 block mb-1">{{ store.t('repairTitle') }}</span>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ issue.title || 'Inspection issue' }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1">{{ store.t('description') }}</span>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ issue.description || '—' }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 block mb-1">Checklist Item</span>
                <span class="badge-blue">{{ checklistLabel }}</span>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="section-title"><Camera :size="16" class="text-blue-500" /> {{ store.t('photos') }}</h3>
            <div v-if="issue.photo_urls?.length" class="grid grid-cols-3 gap-3">
              <div v-for="(src, i) in issue.photo_urls" :key="i" class="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img :src="src" alt="" class="w-full h-full object-cover" />
              </div>
            </div>
            <div v-else class="py-8 text-center">
              <Camera :size="32" class="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p class="text-sm text-gray-400">{{ store.t('noPhotosAttached') }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="card p-5">
            <h3 class="section-title"><Truck :size="16" class="text-blue-500" /> {{ store.t('vehicle') }}</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-gray-400">{{ store.t('unit') }}</span><span class="font-medium text-gray-900 dark:text-white">{{ vehicleLabel }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">{{ store.t('status') }}</span><span class="badge-gray">{{ vehicleStatusText }}</span></div>
            </div>
            <RouterLink v-if="issue.vehicle_id" :to="`/vehicles/${issue.vehicle_id}`" class="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ExternalLink :size="12" /> {{ store.t('openVehicleCard') }}
            </RouterLink>
          </div>

          <div v-if="lastAction" class="card p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
            <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle :size="16" />
              <span class="text-sm font-medium">{{ lastAction }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card p-12 text-center">
      <AlertTriangle :size="40" class="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-gray-500 dark:text-gray-400">{{ store.t('issueNotFound') }}</p>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, AlertTriangle, Wrench, XCircle, CheckCircle, Ban, FileText, Camera, Truck, Info, ExternalLink, Calendar, User, Hash } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()
const issue = ref<any | null>(null)
const loading = ref(false)
const busy = ref(false)
const error = ref<string | null>(null)
const lastAction = ref('')

const statusBadge: Record<string, string> = {
  'under-review': 'badge-yellow',
  'in-repair': 'badge-orange',
  fixed: 'badge-green',
  rejected: 'badge-gray',
}

const canManage = computed(() => ['owner', 'manager'].includes(authStore.profile?.role || ''))
const issueNumber = computed(() => issue.value ? `ISS-${String(issue.value.id).slice(0, 8).toUpperCase()}` : '—')
const vehicleStatus = computed(() => issue.value?.vehicles?.status || '')
const issueStatus = computed(() => issue.value?.status || '')
const isUnderReviewIssue = computed(() => issueStatus.value === 'under-review')
const isTerminalIssue = computed(() => ['fixed', 'rejected', 'in-repair'].includes(issueStatus.value))
const isVehicleBlocked = computed(() => vehicleStatus.value === 'blocked')
const showManagerActions = computed(() => canManage.value && isUnderReviewIssue.value)
const canSendToRepair = computed(() => showManagerActions.value)
const canRejectIssue = computed(() => showManagerActions.value)
const canMarkFixed = computed(() => showManagerActions.value)
const canBlockVehicle = computed(() => showManagerActions.value && !isVehicleBlocked.value)
const vehicleLabel = computed(() => {
  const vehicle = issue.value?.vehicles
  const name = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()
  return [name, vehicle?.unit ? `#${vehicle.unit}` : ''].filter(Boolean).join(' · ') || '—'
})
const driverLabel = computed(() => issue.value?.drivers?.name || '—')
const checklistLabel = computed(() => issue.value?.inspection_results?.inspection_template_items?.title || 'Checklist item')
const inspectionLabel = computed(() => issue.value?.inspections?.type === 'post-trip' ? 'Post-trip' : 'Pre-trip')
const inspectionDate = computed(() => formatDate(issue.value?.inspections?.submitted_at || issue.value?.inspections?.created_at || issue.value?.created_at))
const vehicleStatusText = computed(() => vehicleStatusLabel(vehicleStatus.value))
const terminalStatusMessage = computed(() => {
  if (issueStatus.value === 'in-repair') return 'This issue is already in repair. Continue the workflow from the Repairs page.'
  if (issueStatus.value === 'fixed') return 'This issue has been fixed. No further issue actions are available.'
  if (issueStatus.value === 'rejected') return 'This issue has been rejected. No further issue actions are available.'
  return ''
})

const basicInfo = computed(() => issue.value ? [
  { icon: Hash, label: store.t('issue'), value: issueNumber.value },
  { icon: Truck, label: store.t('vehicle'), value: vehicleLabel.value },
  { icon: User, label: store.t('driver'), value: driverLabel.value },
  { icon: null, label: store.t('inspectionType'), value: inspectionLabel.value },
  { icon: Calendar, label: store.t('inspectionDate'), value: inspectionDate.value },
  { icon: Calendar, label: store.t('issueDate'), value: formatDate(issue.value.created_at) },
  { icon: null, label: store.t('status'), value: statusText(issue.value.status) },
] : [])

onMounted(fetchIssue)

async function fetchIssue() {
  loading.value = true
  error.value = null

  const { data, error: issueError } = await supabase
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
    .eq('id', route.params.id as string)
    .single()

  if (issueError) {
    error.value = issueError.message
    issue.value = null
  } else {
    issue.value = data
  }

  loading.value = false
}

async function updateIssueStatus(status: 'fixed' | 'rejected') {
  if (!canTransitionIssue(status)) return
  busy.value = true
  const { data, error: updateError } = await supabase
    .from('issues')
    .update({ status })
    .eq('id', issue.value.id)
    .select()
    .single()

  if (updateError) {
    error.value = updateError.message
  } else {
    issue.value = { ...issue.value, ...data }
    await restoreVehicleIfReviewResolved()
    flash('Issue status updated')
  }
  busy.value = false
}

async function sendToRepair() {
  if (!canSendToRepair.value || !issue.value) return
  busy.value = true
  error.value = null

  const { error: issueError } = await supabase
    .from('issues')
    .update({ status: 'in-repair' })
    .eq('id', issue.value.id)

  if (issueError) {
    error.value = issueError.message
    busy.value = false
    return
  }

  const { data: existingRepair, error: existingRepairError } = await supabase
    .from('repairs')
    .select('id')
    .eq('issue_id', issue.value.id)
    .limit(1)
    .maybeSingle()

  if (existingRepairError) {
    error.value = existingRepairError.message
    busy.value = false
    return
  }

  if (!existingRepair) {
    const { error: repairError } = await supabase.from('repairs').insert({
      company_id: issue.value.company_id,
      vehicle_id: issue.value.vehicle_id,
      issue_id: issue.value.id,
      title: issue.value.title || 'Inspection issue repair',
      description: issue.value.description || null,
      status: 'open',
    })

    if (repairError) {
      error.value = repairError.message
      busy.value = false
      return
    }
  }

  const vehicleUpdated = await updateVehicleStatus('in-repair', 'Vehicle sent to repair', false)
  if (vehicleUpdated) {
    issue.value = {
      ...issue.value,
      status: 'in-repair',
      vehicles: { ...issue.value.vehicles, status: 'in-repair' },
    }
    flash(existingRepair ? 'Issue moved to repair' : 'Repair created')
  }
  busy.value = false
}

async function markVehicleBlocked() {
  if (!canBlockVehicle.value) return
  await updateVehicleStatus('blocked', 'Vehicle blocked')
}

async function rejectIssue() {
  await updateIssueStatus('rejected')
}

async function markIssueFixed() {
  await updateIssueStatus('fixed')
}

async function updateVehicleStatus(
  status: 'active' | 'blocked' | 'in-repair',
  message: string,
  manageBusy = true
) {
  if (!issue.value?.vehicle_id || !canManage.value) return
  if (manageBusy) busy.value = true
  const { error: vehicleError } = await supabase
    .from('vehicles')
    .update({ status })
    .eq('id', issue.value.vehicle_id)

  if (vehicleError) {
    error.value = vehicleError.message
    if (manageBusy) busy.value = false
    return false
  }
  else {
    issue.value.vehicles = { ...issue.value.vehicles, status }
    flash(message)
  }
  if (manageBusy) busy.value = false
  return true
}

async function restoreVehicleIfReviewResolved() {
  if (!issue.value?.vehicle_id || !canManage.value) return

  const { data: unresolved, error: unresolvedError } = await supabase
    .from('issues')
    .select('id')
    .eq('vehicle_id', issue.value.vehicle_id)
    .in('status', ['under-review', 'in-repair'])
    .limit(1)

  if (unresolvedError) {
    console.error('[IssueDetail] failed to check unresolved vehicle issues', unresolvedError)
    return
  }

  if (unresolved?.length) return

  if (['needs-attention', 'blocked', 'in-repair'].includes(issue.value.vehicles?.status)) {
    await updateVehicleStatus('active', 'Vehicle returned to active')
  }
}

function canTransitionIssue(nextStatus: 'fixed' | 'rejected') {
  if (!issue.value || !canManage.value) return false
  if (!isUnderReviewIssue.value) return false
  return ['fixed', 'rejected'].includes(nextStatus)
}

function statusText(status: string) {
  return {
    'under-review': store.t('statusUnderReview'),
    'in-repair': store.t('statusInRepair'),
    fixed: store.t('statusFixed'),
    rejected: store.t('statusRejected'),
  }[status] || status || '—'
}

function vehicleStatusLabel(status: string) {
  return {
    active: 'Active',
    'needs-attention': 'Needs attention',
    'in-repair': 'In repair',
    blocked: 'Blocked',
  }[status] || status || '—'
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language)
}

function flash(message: string) {
  lastAction.value = message
  window.setTimeout(() => { lastAction.value = '' }, 3000)
}
</script>

<style scoped>
.back-link {
  @apply flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors;
}
.section-title {
  @apply font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2;
}
.action-btn {
  @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed;
}
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.badge-blue { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
</style>
