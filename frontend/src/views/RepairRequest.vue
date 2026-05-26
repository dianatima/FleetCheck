<template>
  <AppLayout :title="selectedRepair ? 'Repair Details' : 'Repairs'">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <div v-if="!selectedRepair" class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchRepairs')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="open">{{ repairStatusLabel('open') }}</option>
          <option value="in-progress">{{ repairStatusLabel('in-progress') }}</option>
          <option value="completed">{{ repairStatusLabel('completed') }}</option>
          <option value="cancelled">{{ repairStatusLabel('cancelled') }}</option>
        </select>
      </div>
      <button @click="fetchRepairData" class="btn-secondary gap-2 text-sm">
        <RefreshCw :size="15" /> Refresh
      </button>
    </div>

    <div v-if="success" class="card p-4 mb-5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
      <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
        <CheckCircle :size="16" />
        <span class="text-sm font-medium">{{ success }}</span>
      </div>
    </div>

    <div v-if="loading" class="card p-6 text-sm text-gray-500 dark:text-gray-400">Loading repairs...</div>
    <div v-else-if="error" class="card p-6 text-sm text-red-500">{{ error }}</div>

    <template v-else>
      <div v-if="!selectedRepair" class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100/80 dark:border-gray-800">
          <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
            Repairs
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="table-header-row">
                <th v-for="header in tableHeaders" :key="header" class="table-th">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedRepairs.length === 0">
                <td :colspan="tableHeaders.length" class="text-center py-12 text-sm text-gray-400">
                  {{ store.t('noRepairsFound') }}
                </td>
              </tr>
              <tr
                v-for="repair in paginatedRepairs"
                :key="repair.id"
                class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors cursor-pointer"
                @click="selectedRepair = repair"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5 min-w-56">
                    <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img v-if="repair.vehicles?.photo_url" :src="repair.vehicles.photo_url" alt="" class="w-full h-full object-cover" />
                      <Truck v-else :size="15" class="text-gray-400" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ vehicleName(repair) }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ vehicleUnitPlate(repair) }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="min-w-52">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ issueTitle(repair.issues) }}</p>
                    <span :class="severityBadge(repair.issues)" class="mt-1">{{ issueSeverity(repair.issues) }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <p class="table-main">{{ inspectionLabel(repair.issues) }}</p>
                  <p class="table-sub">{{ formatDate(repair.issues?.inspections?.submitted_at || repair.issues?.inspections?.created_at) }}</p>
                </td>
                <td class="table-td">{{ driverLabel(repair.issues) }}</td>
                <td class="px-4 py-3">
                  <span :class="repairStatusBadge(repair.status)">{{ repairStatusLabel(repair.status) }}</span>
                </td>
                <td class="px-4 py-3">
                  <span :class="vehicleStatusBadge(repair)">{{ vehicleStatusLabel(repair) }}</span>
                </td>
                <td class="table-td">{{ formatDate(repair.created_at) }}</td>
                <td class="px-4 py-3" @click.stop>
                  <button
                    @click="selectedRepair = repair"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors whitespace-nowrap"
                  >
                    <Eye :size="12" /> View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <BaseTablePagination
          :total="filteredRepairs.length"
          :current-page="page"
          :page-size="pageSize"
          @update:current-page="page = $event"
          @update:page-size="setPageSize"
        />
      </div>

      <div v-else class="space-y-5">
        <button
          @click="closeRepairDetail"
          class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft :size="16" /> {{ store.t('backToRepairs') }}
        </button>

        <article class="card overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100/80 dark:border-gray-800">
            <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
              Repair Details
            </h2>
          </div>
          <div class="p-5 border-b border-gray-100/80 dark:border-gray-800">
            <div class="flex flex-col lg:flex-row lg:items-start gap-5">
              <button
                type="button"
                class="detail-photo"
                @click="openVehicle(selectedRepair.vehicle_id)"
                :aria-label="`Open ${vehicleName(selectedRepair)}`"
              >
                <img v-if="selectedRepair.vehicles?.photo_url" :src="selectedRepair.vehicles.photo_url" alt="" class="w-full h-full object-cover" />
                <Truck v-else :size="30" class="text-blue-500" />
              </button>

              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ vehicleName(selectedRepair) }}</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ vehicleUnitPlate(selectedRepair) }}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span :class="repairStatusBadge(selectedRepair.status)">{{ repairStatusLabel(selectedRepair.status) }}</span>
                    <span :class="vehicleStatusBadge(selectedRepair)">{{ vehicleStatusLabel(selectedRepair) }}</span>
                  </div>
                </div>

                <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
                  <div>
                    <span class="detail-label">Related issue</span>
                    <p class="detail-value">{{ issueTitle(selectedRepair.issues) }}</p>
                    <span :class="severityBadge(selectedRepair.issues)" class="mt-1">{{ issueSeverity(selectedRepair.issues) }}</span>
                  </div>
                  <div>
                    <span class="detail-label">Inspection</span>
                    <p class="detail-value">{{ inspectionLabel(selectedRepair.issues) }}</p>
                    <p class="detail-muted">{{ formatDate(selectedRepair.issues?.inspections?.submitted_at || selectedRepair.issues?.inspections?.created_at) }}</p>
                  </div>
                  <div>
                    <span class="detail-label">Reported by</span>
                    <p class="detail-value">{{ driverLabel(selectedRepair.issues) }}</p>
                  </div>
                  <div>
                    <span class="detail-label">Created</span>
                    <p class="detail-value">{{ formatDate(selectedRepair.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid lg:grid-cols-3 gap-5 p-5">
            <div class="lg:col-span-2 space-y-5">
              <section>
                <h3 class="section-title">Repair notes</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {{ selectedRepair.description || 'No repair notes recorded yet.' }}
                </p>
              </section>

              <section>
                <h3 class="section-title">Issue notes</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {{ selectedRepair.issues?.description || selectedRepair.issues?.inspection_results?.comment || 'No issue notes available.' }}
                </p>
              </section>

              <section>
                <h3 class="section-title">Related photos</h3>
                <div v-if="photoUrls(selectedRepair).length" class="flex flex-wrap gap-3">
                  <a
                    v-for="(photo, index) in photoUrls(selectedRepair)"
                    :key="`${selectedRepair.id}-${index}`"
                    :href="photo"
                    target="_blank"
                    rel="noreferrer"
                    class="photo-thumb"
                  >
                    <img :src="photo" alt="" class="w-full h-full object-cover" />
                  </a>
                </div>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400">No photos attached.</p>
              </section>
            </div>

            <aside class="action-panel">
              <button @click="openVehicle(selectedRepair.vehicle_id)" class="panel-link">
                <Truck :size="14" /> Open Vehicle
              </button>
              <button v-if="selectedRepair.issues?.inspection_id" @click="openReport(selectedRepair.issues.inspection_id)" class="panel-link">
                <FileText :size="14" /> Open Report
              </button>
              <button v-if="selectedRepair.issue_id" @click="openIssue(selectedRepair.issue_id)" class="panel-link">
                <ExternalLink :size="14" /> Open Issue
              </button>

              <div v-if="canManage" class="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <button
                  v-if="selectedRepair.status === 'open'"
                  @click="updateRepairStatus(selectedRepair, 'in-progress')"
                  :disabled="busyId === selectedRepair.id"
                  class="manager-action bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <PlayCircle :size="14" /> Mark In Progress
                </button>
                <button
                  v-if="selectedRepair.status !== 'completed'"
                  @click="completeRepair(selectedRepair)"
                  :disabled="busyId === selectedRepair.id"
                  class="manager-action bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle :size="14" /> Mark Completed
                </button>
                <button
                  v-if="selectedRepair.status !== 'cancelled' && selectedRepair.status !== 'completed'"
                  @click="updateRepairStatus(selectedRepair, 'cancelled')"
                  :disabled="busyId === selectedRepair.id"
                  class="manager-action bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <XCircle :size="14" /> Cancel Repair
                </button>
              </div>
            </aside>
          </div>
        </article>
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  PlayCircle,
  RefreshCw,
  Search,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'

type RepairStatus = 'open' | 'in-progress' | 'completed' | 'cancelled'

const router = useRouter()
const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()

const repairs = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref('')
const busyId = ref('')
const search = ref('')
const filterStatus = ref('all')
const selectedRepair = ref<any | null>(null)
const page = ref(1)
const pageSize = ref(10)

const unresolvedIssueStatuses = ['under-review', 'in-repair']
const canManage = computed(() => ['owner', 'manager'].includes(authStore.profile?.role || ''))
const tableHeaders = ['Vehicle', 'Issue', 'Inspection', 'Reported by', 'Status', 'Vehicle status', 'Created date', 'Actions']

const summaryStats = computed(() => [
  { label: repairStatusLabel('open'), count: repairs.value.filter((repair) => repair.status === 'open').length, color: 'text-red-600 dark:text-red-400' },
  { label: repairStatusLabel('in-progress'), count: repairs.value.filter((repair) => repair.status === 'in-progress').length, color: 'text-orange-600 dark:text-orange-400' },
  { label: repairStatusLabel('completed'), count: repairs.value.filter((repair) => repair.status === 'completed').length, color: 'text-green-600 dark:text-green-400' },
  { label: repairStatusLabel('cancelled'), count: repairs.value.filter((repair) => repair.status === 'cancelled').length, color: 'text-gray-500 dark:text-gray-400' },
])

const filteredRepairs = computed(() => {
  const q = search.value.trim().toLowerCase()

  return repairs.value.filter((repair) => {
    const haystack = [
      repair.title,
      repair.description,
      repair.status,
      vehicleLabel(repair),
      issueTitle(repair.issues),
      repair.issues?.description,
      driverLabel(repair.issues),
      inspectionLabel(repair.issues),
      vehicleStatusLabel(repair),
    ].filter(Boolean).join(' ').toLowerCase()

    const matchesSearch = !q || haystack.includes(q)
    const matchesStatus = filterStatus.value === 'all' || repair.status === filterStatus.value
    return matchesSearch && matchesStatus
  })
})

const paginatedRepairs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRepairs.value.slice(start, start + pageSize.value)
})

watch([search, filterStatus, pageSize], () => {
  page.value = 1
})

onMounted(fetchRepairData)

watch(
  () => authStore.companyId,
  () => fetchRepairData()
)

watch(
  () => [route.params.id, route.query.repairId],
  () => selectRepairFromRoute()
)

async function fetchRepairData() {
  if (!authStore.companyId) {
    repairs.value = []
    selectedRepair.value = null
    return
  }

  loading.value = true
  error.value = null

  const { data, error: repairError } = await supabase
    .from('repairs')
    .select(`
      id,
      company_id,
      vehicle_id,
      issue_id,
      title,
      description,
      status,
      created_at,
      vehicles (
        id,
        unit,
        make,
        model,
        plate,
        status,
        photo_url
      ),
      issues (
        id,
        company_id,
        vehicle_id,
        driver_id,
        inspection_id,
        inspection_result_id,
        title,
        description,
        status,
        severity,
        photo_urls,
        created_at,
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
          comment,
          photo_urls,
          inspection_template_items (
            title
          )
        )
      )
    `)
    .eq('company_id', authStore.companyId)
    .order('created_at', { ascending: false })

  if (repairError) {
    error.value = repairError.message
    repairs.value = []
    loading.value = false
    return
  }

  repairs.value = data || []

  if (selectedRepair.value) {
    selectedRepair.value = repairs.value.find((repair) => repair.id === selectedRepair.value.id) || null
  }
  selectRepairFromRoute()

  loading.value = false
}

function selectRepairFromRoute() {
  const repairId = String(route.params.id || route.query.repairId || '')
  if (!repairId) {
    selectedRepair.value = null
    return
  }
  if (!repairs.value.length) return
  selectedRepair.value = repairs.value.find((repair) => repair.id === repairId) || selectedRepair.value
}

function closeRepairDetail() {
  selectedRepair.value = null
  if (route.params.id || route.query.repairId) {
    router.push('/repairs')
  }
}

async function updateRepairStatus(repair: any, status: RepairStatus) {
  if (!canManage.value || !repair?.id) return
  busyId.value = repair.id
  error.value = null

  const { error: repairError } = await supabase
    .from('repairs')
    .update({ status })
    .eq('id', repair.id)
    .eq('company_id', authStore.companyId)

  if (repairError) {
    error.value = repairError.message
    busyId.value = ''
    return
  }

  if (status === 'in-progress') {
    await syncRepairStarted(repair)
  }

  if (status === 'cancelled' && repair.issue_id) {
    await supabase.from('issues').update({ status: 'under-review' }).eq('id', repair.issue_id)
    await restoreVehicleIfResolved(repair.vehicle_id)
  }

  flash(`Repair marked ${repairStatusLabel(status).toLowerCase()}`)
  busyId.value = ''
  await fetchRepairData()
}

async function completeRepair(repair: any) {
  if (!canManage.value || !repair?.id) return
  busyId.value = repair.id
  error.value = null

  const { error: repairError } = await supabase
    .from('repairs')
    .update({ status: 'completed' })
    .eq('id', repair.id)
    .eq('company_id', authStore.companyId)

  if (repairError) {
    error.value = repairError.message
    busyId.value = ''
    return
  }

  if (repair.issue_id) {
    const { error: issueError } = await supabase
      .from('issues')
      .update({ status: 'fixed' })
      .eq('id', repair.issue_id)

    if (issueError) {
      error.value = issueError.message
      busyId.value = ''
      return
    }
  }

  await restoreVehicleIfResolved(repair.vehicle_id)
  flash('Repair completed and issue marked fixed')
  busyId.value = ''
  await fetchRepairData()
}

async function syncRepairStarted(repair: any) {
  if (repair.issue_id) {
    const { error: issueError } = await supabase
      .from('issues')
      .update({ status: 'in-repair' })
      .eq('id', repair.issue_id)

    if (issueError) console.error('[Repairs] failed to move issue to in-repair', issueError)
  }

  if (repair.vehicle_id) {
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'in-repair' })
      .eq('id', repair.vehicle_id)

    if (vehicleError) console.error('[Repairs] failed to mark vehicle in repair', vehicleError)
  }
}

async function restoreVehicleIfResolved(vehicleId: string | null) {
  if (!vehicleId) return

  const { data: unresolved, error: unresolvedError } = await supabase
    .from('issues')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .in('status', unresolvedIssueStatuses)
    .limit(1)

  if (unresolvedError) {
    console.error('[Repairs] failed to check unresolved vehicle issues', unresolvedError)
    return
  }

  if (unresolved?.length) return

  const { error: vehicleError } = await supabase
    .from('vehicles')
    .update({ status: 'active' })
    .eq('id', vehicleId)

  if (vehicleError) console.error('[Repairs] failed to return vehicle to active', vehicleError)
}

function openVehicle(vehicleId: string | null) {
  if (!vehicleId) return
  router.push(`/vehicles/${vehicleId}`)
}

function openIssue(issueId: string | null) {
  if (!issueId) return
  router.push(`/issues/${issueId}`)
}

function openReport(inspectionId: string | null) {
  if (!inspectionId) return
  router.push(`/reports/${inspectionId}`)
}

function vehicleName(row: any) {
  const vehicle = row?.vehicles || row
  return `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || 'Vehicle'
}

function vehicleUnitPlate(row: any) {
  const vehicle = row?.vehicles || row
  return [
    vehicle?.unit ? `Unit ${vehicle.unit}` : 'Unit —',
    vehicle?.plate ? `Plate ${vehicle.plate}` : 'Plate —',
  ].join(' · ')
}

function vehicleLabel(row: any) {
  return `${vehicleName(row)} · ${vehicleUnitPlate(row)}`
}

function issueTitle(issue: any) {
  return issue?.title || issue?.inspection_results?.inspection_template_items?.title || 'Inspection issue'
}

function driverLabel(issue: any) {
  return issue?.drivers?.name || '—'
}

function inspectionLabel(issue: any) {
  const inspection = issue?.inspections
  if (!inspection) return '—'
  return inspection.type === 'post-trip' ? 'Post-trip' : 'Pre-trip'
}

function photoUrls(repair: any) {
  return [
    ...(repair?.issues?.photo_urls || []),
    ...(repair?.issues?.inspection_results?.photo_urls || []),
  ].filter(Boolean)
}

function issueSeverity(issue: any) {
  return severityLabel(issue?.severity)
}

function severityBadge(issue: any) {
  return severityBadgeValue(issue?.severity)
}

function severityLabel(severity: string | null) {
  return {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }[severity || 'medium'] || 'Medium'
}

function severityBadgeValue(severity: string | null) {
  return {
    low: 'badge-green',
    medium: 'badge-orange',
    high: 'badge-red',
  }[severity || 'medium'] || 'badge-orange'
}

function repairStatusLabel(status: string) {
  return {
    open: 'Open',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }[status] || status || '—'
}

function repairStatusBadge(status: string) {
  return {
    open: 'badge-red',
    'in-progress': 'badge-orange',
    completed: 'badge-green',
    cancelled: 'badge-gray',
  }[status] || 'badge-gray'
}

function vehicleDisplayStatus(repair: any) {
  const raw = repair?.vehicles?.status
  if (repair?.issues?.status === 'under-review') return 'needs-attention'
  if (raw === 'in-repair') return 'in-repair'
  if (raw === 'blocked') return 'blocked'
  return raw || 'active'
}

function vehicleStatusLabel(repair: any) {
  return {
    active: 'Active',
    'needs-attention': 'Needs Attention',
    'in-repair': 'In repair',
    blocked: 'Blocked',
  }[vehicleDisplayStatus(repair)] || vehicleDisplayStatus(repair)
}

function vehicleStatusBadge(repair: any) {
  return {
    active: 'badge-green',
    'needs-attention': 'badge-yellow',
    'in-repair': 'badge-orange',
    blocked: 'badge-red',
  }[vehicleDisplayStatus(repair)] || 'badge-gray'
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language)
}

function setPageSize(size: number) {
  pageSize.value = size
  page.value = 1
}

function flash(message: string) {
  success.value = message
  window.setTimeout(() => {
    if (success.value === message) success.value = ''
  }, 3000)
}
</script>

<style scoped>
.table-th {
  @apply text-left text-[11px] font-medium tracking-normal text-gray-500 dark:text-gray-400 px-4 py-3.5 whitespace-nowrap;
}

.table-td {
  @apply px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap align-middle;
}

.table-main {
  @apply text-sm font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap;
}

.table-sub {
  @apply text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mt-0.5;
}

.detail-photo {
  @apply w-full lg:w-36 h-36 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-blue-500 transition-all;
}

.detail-label {
  @apply text-xs font-medium text-gray-400 dark:text-gray-500 block;
}

.detail-value {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200 mt-1;
}

.detail-muted {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-1;
}

.section-title {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200 mb-2;
}

.photo-thumb {
  @apply w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all;
}

.action-panel {
  @apply rounded-2xl border border-gray-100 dark:border-gray-700 p-3 space-y-2 h-fit;
}

.panel-link {
  @apply w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors;
}

.manager-action {
  @apply w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed;
}

.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.badge-red { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400; }
</style>
