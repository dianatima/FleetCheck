<template>
  <AppLayout :title="selectedRepair ? 'Repair Details' : 'Repairs'">
    <div v-if="!selectedRepair" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <div v-if="!selectedRepair" class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative w-full sm:flex-1 sm:min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchRepairs')" />
      </div>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterStatus" class="input-field py-2 text-sm sm:w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="open">{{ repairStatusLabel('open') }}</option>
          <option value="in-progress">{{ repairStatusLabel('in-progress') }}</option>
          <option value="completed">{{ repairStatusLabel('completed') }}</option>
          <option value="cancelled">{{ repairStatusLabel('cancelled') }}</option>
        </select>
      </div>
      <select v-model="filterVehicle" class="input-field py-2 text-sm sm:w-auto">
        <option value="all">All Vehicles</option>
        <option v-for="vehicle in vehicleOptions" :key="vehicle.id" :value="vehicle.id">
          {{ vehicle.label }}
        </option>
      </select>
      <select v-model="filterIssue" class="input-field py-2 text-sm sm:w-auto">
        <option value="all">All Issues</option>
        <option v-for="issue in issueOptions" :key="issue.value" :value="issue.value">
          {{ issue.label }}
        </option>
      </select>
    </div>

    <div
      v-if="!selectedRepair && activeFilterChips.length"
      class="flex flex-wrap gap-2 mb-5"
    >
      <span
        v-for="chip in activeFilterChips"
        :key="chip.key"
        class="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
      >
        {{ chip.label }}
        <button
          type="button"
          class="font-medium hover:underline"
          @click="clearFilterChip(chip.key)"
        >
          Clear
        </button>
      </span>
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
        <div class="hidden md:block overflow-x-auto">
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
        <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          <div v-if="paginatedRepairs.length === 0" class="px-4 py-12 text-center text-sm text-gray-400">
            {{ store.t('noRepairsFound') }}
          </div>
          <div
            v-for="repair in paginatedRepairs"
            :key="repair.id"
            class="p-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/45"
            role="button"
            tabindex="0"
            @click="selectedRepair = repair"
          >
            <div class="flex gap-3">
              <div class="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                <img v-if="repair.vehicles?.photo_url" :src="repair.vehicles.photo_url" alt="" class="h-full w-full object-cover" />
                <Truck v-else :size="18" class="text-gray-400" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="mobile-card-title truncate">{{ vehicleName(repair) }}</p>
                    <p class="mobile-card-meta">{{ vehicleUnitPlate(repair) }}</p>
                    <p class="mobile-card-meta">{{ issueTitle(repair.issues) }}</p>
                  </div>
                  <span :class="repairStatusBadge(repair.status)" class="flex-shrink-0">
                    {{ repairStatusLabel(repair.status) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                <p class="text-gray-400">Vehicle status</p>
                <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">{{ vehicleStatusLabel(repair) }}</p>
              </div>
              <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                <p class="text-gray-400">Created</p>
                <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">{{ formatDate(repair.created_at) }}</p>
              </div>
            </div>

            <button class="btn-secondary mt-3 w-full text-sm" @click.stop="selectedRepair = repair">
              <Eye :size="15" />
              View
            </button>
          </div>
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
          <div class="p-5">
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
        </article>

        <div class="grid lg:grid-cols-3 gap-5">
          <div class="lg:col-span-2 space-y-5">
            <section class="card p-5">
              <h3 class="section-title">Basic Information</h3>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <span class="detail-label">Repair ID</span>
                  <p class="detail-value">{{ repairNumber(selectedRepair) }}</p>
                </div>
                <div>
                  <span class="detail-label">Vehicle</span>
                  <p class="detail-value">{{ vehicleLabel(selectedRepair) }}</p>
                </div>
                <div>
                  <span class="detail-label">Issue</span>
                  <p class="detail-value">{{ issueTitle(selectedRepair.issues) }}</p>
                </div>
                <div>
                  <span class="detail-label">Severity</span>
                  <span :class="severityBadge(selectedRepair.issues)" class="mt-1">{{ issueSeverity(selectedRepair.issues) }}</span>
                </div>
                <div>
                  <span class="detail-label">Driver</span>
                  <p class="detail-value">{{ driverLabel(selectedRepair.issues) }}</p>
                </div>
                <div>
                  <span class="detail-label">Inspection Type</span>
                  <p class="detail-value">{{ inspectionLabel(selectedRepair.issues) }}</p>
                </div>
                <div>
                  <span class="detail-label">Inspection Date</span>
                  <p class="detail-value">{{ formatDate(selectedRepair.issues?.inspections?.submitted_at || selectedRepair.issues?.inspections?.created_at) }}</p>
                </div>
                <div>
                  <span class="detail-label">Created Date</span>
                  <p class="detail-value">{{ formatDate(selectedRepair.created_at) }}</p>
                </div>
                <div>
                  <span class="detail-label">Status</span>
                  <span :class="repairStatusBadge(selectedRepair.status)" class="mt-1">{{ repairStatusLabel(selectedRepair.status) }}</span>
                </div>
              </div>
            </section>

            <section class="card p-5">
              <h3 class="section-title">Notes</h3>
              <div class="space-y-5">
                <div>
                  <span class="detail-label">Issue notes</span>
                  <p class="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {{ issueNotes(selectedRepair.issues) || 'No issue notes available.' }}
                  </p>
                </div>

                <div v-if="visibleRepairNotes(selectedRepair) || canEditRepairNotes(selectedRepair)" class="space-y-3">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <span class="detail-label">Repair notes</span>
                    <button
                      v-if="canEditRepairNotes(selectedRepair) && !repairNotesEditing"
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      @click="startEditRepairNotes"
                    >
                      {{ visibleRepairNotes(selectedRepair) ? 'Edit repair notes' : 'Add repair notes' }}
                    </button>
                  </div>

                  <div v-if="repairNotesEditing" class="space-y-3">
                    <textarea
                      v-model="repairNotesDraft"
                      rows="4"
                      class="input-field resize-none text-sm"
                      placeholder="Add manager repair notes..."
                    />
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        :disabled="repairNotesSaving"
                        @click="cancelEditRepairNotes"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="px-3 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="repairNotesSaving"
                        @click="saveRepairNotes"
                      >
                        {{ repairNotesSaving ? 'Saving...' : 'Save notes' }}
                      </button>
                    </div>
                  </div>

                  <p v-else-if="visibleRepairNotes(selectedRepair)" class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {{ visibleRepairNotes(selectedRepair) }}
                  </p>
                </div>
              </div>
            </section>

            <section class="card p-5">
              <h3 class="section-title">Related Photos</h3>
              <div v-if="photoUrls(selectedRepair).length" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  v-for="(photo, index) in photoUrls(selectedRepair)"
                  :key="`${selectedRepair.id}-${index}`"
                  type="button"
                  class="photo-thumb aspect-video"
                  @click="openPhotoLightbox(photoUrls(selectedRepair), index)"
                >
                  <img :src="photo" alt="" class="w-full h-full object-cover" />
                </button>
              </div>
              <div v-else class="py-8 text-center">
                <p class="text-sm text-gray-400">No photos attached.</p>
              </div>
            </section>
          </div>

          <aside class="space-y-5">
            <section class="card p-5">
              <h3 class="section-title">Related Links</h3>
              <div class="space-y-2">
                <button @click="openVehicle(selectedRepair.vehicle_id)" class="panel-link">
                  <Truck :size="14" /> Open Vehicle
                </button>
                <button v-if="selectedRepair.issues?.inspection_id" @click="openReport(selectedRepair.issues.inspection_id)" class="panel-link">
                  <FileText :size="14" /> Open Report
                </button>
                <button v-if="selectedRepair.issue_id" @click="openIssue(selectedRepair.issue_id)" class="panel-link">
                  <ExternalLink :size="14" /> Open Issue
                </button>
              </div>
            </section>

            <section v-if="canManage" class="card p-5">
              <h3 class="section-title">Repair Actions</h3>
              <div class="space-y-2">
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
            </section>
          </aside>
        </div>
      </div>
    </template>

    <PhotoLightbox
      v-model="photoLightboxOpen"
      :photos="lightboxPhotos"
      :start-index="lightboxStartIndex"
    />
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
  Search,
  Truck,
  XCircle,
} from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import PhotoLightbox from '@/components/shared/PhotoLightbox.vue'
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
const filterVehicle = ref('all')
const filterIssue = ref('all')
const selectedRepair = ref<any | null>(null)
const page = ref(1)
const pageSize = ref(10)
const photoLightboxOpen = ref(false)
const lightboxPhotos = ref<string[]>([])
const lightboxStartIndex = ref(0)
const repairNotesDraft = ref('')
const repairNotesEditing = ref(false)
const repairNotesSaving = ref(false)

const unresolvedIssueStatuses = ['under-review', 'in-repair']
const canManage = computed(() => ['owner', 'manager'].includes(authStore.profile?.role || ''))
const tableHeaders = ['Vehicle', 'Issue', 'Inspection', 'Reported by', 'Status', 'Vehicle status', 'Created date', 'Actions']

const summaryStats = computed(() => [
  { label: repairStatusLabel('open'), count: repairs.value.filter((repair) => repair.status === 'open').length, color: 'text-red-600 dark:text-red-400' },
  { label: repairStatusLabel('in-progress'), count: repairs.value.filter((repair) => repair.status === 'in-progress').length, color: 'text-orange-600 dark:text-orange-400' },
  { label: repairStatusLabel('completed'), count: repairs.value.filter((repair) => repair.status === 'completed').length, color: 'text-green-600 dark:text-green-400' },
  { label: repairStatusLabel('cancelled'), count: repairs.value.filter((repair) => repair.status === 'cancelled').length, color: 'text-gray-500 dark:text-gray-400' },
])

const vehicleOptions = computed(() => {
  const byId = new Map<string, { id: string; label: string }>()

  for (const repair of repairs.value) {
    if (repair.vehicle_id) {
      byId.set(repair.vehicle_id, {
        id: repair.vehicle_id,
        label: vehicleLabel(repair),
      })
    }
  }

  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const issueOptions = computed(() => {
  const byValue = new Map<string, { value: string; label: string }>()

  for (const repair of repairs.value) {
    for (const label of issueFilterLabels(repair)) {
      const trimmed = label.trim()
      if (trimmed) byValue.set(trimmed, { value: trimmed, label: trimmed })
    }
  }

  return [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const activeFilterChips = computed(() => {
  const chips: Array<{ key: string; label: string }> = []

  if (filterStatus.value !== 'all') {
    chips.push({
      key: 'status',
      label: `Status: ${repairStatusLabel(filterStatus.value)}`,
    })
  }

  if (filterVehicle.value !== 'all') {
    chips.push({
      key: 'vehicle_id',
      label: `Vehicle: ${vehicleOptions.value.find((vehicle) => vehicle.id === filterVehicle.value)?.label || 'Selected vehicle'}`,
    })
  }

  if (filterIssue.value !== 'all') {
    chips.push({
      key: 'issue',
      label: `Issue: ${filterIssue.value}`,
    })
  }

  return chips
})

const filteredRepairs = computed(() => {
  const q = search.value.trim().toLowerCase()

  return repairs.value.filter((repair) => {
    const issueLabels = issueFilterLabels(repair)
    const haystack = [
      repair.title,
      repair.notes,
      repair.description,
      repair.status,
      vehicleLabel(repair),
      ...issueLabels,
      repair.issues?.description,
      driverLabel(repair.issues),
      inspectionLabel(repair.issues),
      vehicleStatusLabel(repair),
    ].filter(Boolean).join(' ').toLowerCase()

    const matchesSearch = !q || haystack.includes(q)
    const matchesStatus = filterStatus.value === 'all' || repair.status === filterStatus.value
    const matchesVehicle = filterVehicle.value === 'all' || repair.vehicle_id === filterVehicle.value
    const matchesIssue =
      filterIssue.value === 'all' ||
      issueLabels.some((label) => label.toLowerCase() === filterIssue.value.toLowerCase())

    return matchesSearch && matchesStatus && matchesVehicle && matchesIssue
  })
})

const paginatedRepairs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRepairs.value.slice(start, start + pageSize.value)
})

watch([search, filterStatus, filterVehicle, filterIssue, pageSize], () => {
  page.value = 1
})

onMounted(async () => {
  syncFiltersFromQuery()
  await fetchRepairData()
})

watch(
  () => authStore.companyId,
  () => fetchRepairData()
)

watch(
  () => [route.params.id, route.query.repairId],
  () => selectRepairFromRoute()
)

watch(
  () => route.query,
  () => syncFiltersFromQuery()
)

watch(
  () => selectedRepair.value?.id,
  () => cancelEditRepairNotes()
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
      notes,
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
            title,
            category_id,
            inspection_item_categories (
              id,
              name
            )
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

function syncFiltersFromQuery() {
  filterStatus.value = String(route.query.status || 'all')
  filterVehicle.value = String(route.query.vehicle_id || 'all')
  filterIssue.value = String(route.query.issue || 'all')
  page.value = 1
}

function clearFilterChip(key: string) {
  const query = { ...route.query }
  delete query[key]

  if (key === 'status') filterStatus.value = 'all'
  if (key === 'vehicle_id') filterVehicle.value = 'all'
  if (key === 'issue') filterIssue.value = 'all'

  router.replace({ path: '/repairs', query })
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

function issueNotes(issue: any) {
  return (
    issue?.inspection_results?.comment ||
    issue?.description ||
    ''
  ).trim()
}

function visibleRepairNotes(repair: any) {
  const notes = (repair?.notes || '').trim()
  if (!notes) return ''

  const originalIssueNotes = issueNotes(repair?.issues)
  if (originalIssueNotes && notes === originalIssueNotes) return ''

  return notes
}

function canEditRepairNotes(repair: any) {
  return canManage.value && ['open', 'in-progress'].includes(repair?.status)
}

function startEditRepairNotes() {
  if (!canEditRepairNotes(selectedRepair.value)) return
  repairNotesDraft.value = selectedRepair.value.notes || ''
  repairNotesEditing.value = true
}

function cancelEditRepairNotes() {
  repairNotesEditing.value = false
  repairNotesDraft.value = ''
  repairNotesSaving.value = false
}

async function saveRepairNotes() {
  if (!selectedRepair.value?.id) return

  if (!canEditRepairNotes(selectedRepair.value)) {
    error.value = 'Repair notes cannot be edited after repair is completed or cancelled.'
    repairNotesEditing.value = false
    repairNotesSaving.value = false
    return
  }

  repairNotesSaving.value = true
  error.value = null

  const notes = repairNotesDraft.value.trim() || null
  const { error: notesError } = await supabase
    .from('repairs')
    .update({ notes })
    .eq('id', selectedRepair.value.id)
    .eq('company_id', authStore.companyId)

  if (notesError) {
    error.value = notesError.message
    repairNotesSaving.value = false
    return
  }

  const nextRepair = { ...selectedRepair.value, notes }
  selectedRepair.value = nextRepair
  const repairIndex = repairs.value.findIndex((repair) => repair.id === nextRepair.id)
  if (repairIndex >= 0) repairs.value.splice(repairIndex, 1, nextRepair)

  repairNotesEditing.value = false
  repairNotesDraft.value = ''
  repairNotesSaving.value = false
  flash(notes ? 'Repair notes saved' : 'Repair notes cleared')
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

function repairNumber(repair: any) {
  return repair?.id ? `REP-${String(repair.id).slice(0, 8).toUpperCase()}` : '—'
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

function issueCategoryName(issue: any) {
  return issue?.inspection_results?.inspection_template_items?.inspection_item_categories?.name || ''
}

function issueFilterLabels(repair: any) {
  return [
    repair?.title,
    issueTitle(repair?.issues),
    issueCategoryName(repair?.issues),
  ].filter(Boolean)
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

function openPhotoLightbox(photos: string[] | null | undefined, index = 0) {
  const cleanPhotos = (photos || []).filter(Boolean)
  if (!cleanPhotos.length) return
  lightboxPhotos.value = cleanPhotos
  lightboxStartIndex.value = index
  photoLightboxOpen.value = true
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
  @apply w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-blue-500 hover:opacity-90 transition-all;
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
