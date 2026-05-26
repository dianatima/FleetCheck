<template>
  <AppLayout title="Report Details">
    <RouterLink :to="vehiclePath" class="card vehicle-context-card group">
      <div class="vehicle-photo">
        <img
          v-if="vehicle?.photo_url"
          :src="vehicle.photo_url"
          alt=""
          class="w-full h-full object-cover"
          @error="hideBrokenImage"
        />
        <Truck v-else :size="28" class="text-gray-300 dark:text-gray-600" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {{ vehicleName }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ vehicle?.unit ? `Unit ${vehicle.unit}` : 'Unit —' }} · {{ vehicle?.plate || 'No plate' }}
            </p>
          </div>
          <span :class="vehicleStatusBadge">{{ vehicleStatusLabel }}</span>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 text-xs">
          <div class="context-tile">
            <span class="context-label">VIN</span>
            <span class="context-value font-mono">{{ vehicle?.vin || '—' }}</span>
          </div>
          <div class="context-tile">
            <span class="context-label">Inspection</span>
            <span class="context-value">{{ typeLabel }}</span>
          </div>
          <div class="context-tile">
            <span class="context-label">Status</span>
            <span class="context-value capitalize">{{ inspection?.status || '—' }}</span>
          </div>
          <div class="context-tile">
            <span class="context-label">Driver</span>
            <span class="context-value">{{ driverLabel }}</span>
          </div>
          <div class="context-tile">
            <span class="context-label">Time</span>
            <span class="context-value">{{ timeLabel }}</span>
          </div>
        </div>
      </div>

      <span class="open-vehicle-btn">
        <ExternalLink :size="14" /> Open Vehicle
      </span>
    </RouterLink>

    <!-- Result banner -->
    <div class="rounded-2xl p-8 text-center mb-6" :class="passed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'">
      <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" :class="passed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'">
        <CheckCircle v-if="passed" :size="40" class="text-green-500" />
        <AlertTriangle v-else :size="40" class="text-red-500" />
      </div>
      <h2 class="text-2xl font-bold mb-2" :class="passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
        {{ passed ? store.t('inspectionPassed') : store.t('inspectionFailed') }}
      </h2>
      <p class="text-sm" :class="passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
        {{ passed ? store.t('vehicleReadyForOperation') : `${failedItems.length} ${store.t('issuesFoundMessage')}` }}
      </p>
    </div>

    <!-- Summary -->
    <div class="card p-5 mb-5">
      <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">{{ store.t('inspectionSummary') }}</h3>
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ passCount }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('statusPassed') }}</div>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ failedItems.length }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('statusFailed') }}</div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-gray-600 dark:text-gray-300">{{ naCount }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">N/A</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div><span class="font-medium text-gray-700 dark:text-gray-300">{{ store.t('vehicle') }}:</span> {{ vehicleName }}</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">{{ store.t('driver') }}:</span> {{ driverLabel }}</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">{{ store.t('type') }}:</span> {{ typeLabel }}</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">{{ store.t('time') }}:</span> {{ timeLabel }}</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">{{ store.t('photosTaken') }}:</span> {{ photoCount }}</div>
      </div>
    </div>

    <!-- Failed items -->
    <div v-if="!passed" class="card mb-5">
      <div class="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-700">
        <AlertTriangle :size="16" class="text-red-500" />
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('failedItems') }}</h3>
      </div>
      <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
        <div v-for="item in failedItems" :key="item.item" class="p-4">
          <div class="flex items-start justify-between gap-2 mb-1">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.item }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.section }}</p>
            </div>
            <span v-if="item.requiresPhoto" class="badge-orange">Photo</span>
          </div>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1.5 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{{ item.comment }}</p>
          <div v-if="item.photos.length" class="mt-3 flex flex-wrap gap-2">
            <img
              v-for="(photo, index) in item.photos"
              :key="`${item.item}-${index}`"
              :src="photo"
              alt=""
              class="w-20 h-20 rounded-lg object-cover border border-red-100 dark:border-red-900/40"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-3 pb-4">
      <div v-if="pdfError" class="card p-3 text-sm text-red-500">
        {{ pdfError }}
      </div>
      <button
        type="button"
        class="btn-secondary w-full py-3 gap-2 text-sm justify-center inline-flex"
        :disabled="downloading"
        @click="downloadPdf"
      >
        <Download :size="16" /> {{ downloading ? 'Preparing PDF...' : 'Download PDF' }}
      </button>
      <RouterLink :to="reportLink" class="btn-secondary w-full py-3 gap-2 text-sm justify-center inline-flex">
        <FileText :size="16" /> {{ store.t('viewFullReport') }}
      </RouterLink>
      <RouterLink to="/driver/vehicles" class="btn-secondary w-full py-3 gap-2 text-sm justify-center inline-flex">
        <Truck :size="16" /> Back to Vehicles
      </RouterLink>
      <RouterLink to="/driver" class="btn-secondary w-full py-3 gap-2 text-sm justify-center inline-flex">
        <RotateCcw :size="16" /> {{ store.t('backToDashboard') }}
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CheckCircle, AlertTriangle, Download, FileText, RotateCcw, Truck, ExternalLink } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import AppLayout from '../components/layout/AppLayout.vue'
import { formatDateTime } from '@/lib/dateFormat'
import { downloadInspectionReportPdf } from '@/lib/reportPdf'

const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const inspection = ref<any | null>(null)
const results = ref<any[]>([])
const downloading = ref(false)
const pdfError = ref<string | null>(null)

onMounted(loadInspectionResult)

const failedItems = computed(() =>
  results.value
    .filter((row) => row.result === 'fail')
    .map((row) => ({
      section: row.inspection_template_items?.category || 'Checklist',
      item: row.inspection_template_items?.title || 'Checklist item',
      requiresPhoto: Boolean(row.inspection_template_items?.requires_photo),
      comment: row.comment || '',
      photos: row.photo_urls || [],
    }))
)
const passed = computed(() => results.value.length ? failedItems.value.length === 0 : store.inspectionResult !== 'fail')
const passCount = computed(() => results.value.filter((row) => row.result === 'pass').length)
const naCount = computed(() => results.value.filter((row) => row.result === 'not_applicable').length)
const photoCount = computed(() => results.value.reduce((count, row) => count + (row.photo_urls?.length || 0), 0))
const vehicle = computed(() => {
  return Array.isArray(inspection.value?.vehicles) ? inspection.value.vehicles[0] : inspection.value?.vehicles
})
const vehicleName = computed(() => {
  const vehicleValue = vehicle.value
  const name = `${vehicleValue?.make || ''} ${vehicleValue?.model || ''}`.trim()
  return name || 'Vehicle'
})
const driverLabel = computed(() => {
  const driver = Array.isArray(inspection.value?.drivers) ? inspection.value.drivers[0] : inspection.value?.drivers
  return driver?.name || '—'
})
const typeLabel = computed(() => inspection.value?.type === 'post-trip' ? store.t('postTripInspection') : store.t('preTripInspection'))
const vehiclePath = computed(() => {
  const id = inspection.value?.vehicle_id || vehicle.value?.id
  const prefix = authStore.profile?.role === 'driver' ? '/driver/vehicles' : '/vehicles'
  return id ? `${prefix}/${id}` : prefix
})
const vehicleStatusLabel = computed(() => {
  return {
    active: store.t('statusActive'),
    'needs-attention': store.t('statusNeedsAttention'),
    blocked: store.t('statusBlocked'),
    'in-repair': store.t('statusInRepair'),
  }[vehicle.value?.status as string] || vehicle.value?.status || '—'
})
const vehicleStatusBadge = computed(() => {
  return {
    active: 'badge-green',
    'needs-attention': 'badge-orange',
    blocked: 'badge-red',
    'in-repair': 'badge-gray',
  }[vehicle.value?.status as string] || 'badge-gray'
})
const reportLink = computed(() =>
  inspection.value?.id ? `/driver/reports/${inspection.value.id}` : '/driver/reports'
)
const timeLabel = computed(() =>
  formatDateTime(inspection.value?.created_at, store.language)
)

async function loadInspectionResult() {
  const inspectionId = String(route.query.inspectionId || '')
  if (!inspectionId) return

  const { data: inspectionData } = await supabase
    .from('inspections')
    .select(`
      id,
      type,
      status,
      created_at,
      submitted_at,
      vehicle_id,
      vehicles (
        id,
        unit,
        make,
        model,
        plate,
        vin,
        status,
        photo_url
      ),
      drivers (
        name
      )
    `)
    .eq('id', inspectionId)
    .single()
  inspection.value = inspectionData || null

  const { data } = await supabase
    .from('inspection_results')
    .select(`
      id,
      result,
      comment,
      photo_urls,
      inspection_template_items (
        title,
        category,
        requires_photo
      )
    `)
    .eq('inspection_id', inspectionId)
  results.value = data || []
}

async function downloadPdf() {
  if (!inspection.value?.id) return
  downloading.value = true
  pdfError.value = null

  try {
    await downloadInspectionReportPdf(inspection.value.id, store.language)
  } catch (downloadError: any) {
    pdfError.value = downloadError?.message || 'Report PDF could not be downloaded.'
  } finally {
    downloading.value = false
  }
}

function hideBrokenImage(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}
</script>

<style scoped>
.vehicle-context-card {
  @apply p-4 mb-5 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/40 cursor-pointer;
}

.vehicle-photo {
  @apply w-full lg:w-28 h-36 lg:h-24 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0;
}

.context-tile {
  @apply rounded-lg bg-gray-50 dark:bg-gray-800/70 px-3 py-2 min-w-0;
}

.context-label {
  @apply block text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500;
}

.context-value {
  @apply block text-xs font-semibold text-gray-800 dark:text-gray-100 mt-0.5 truncate;
}

.open-vehicle-btn {
  @apply inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap self-start lg:self-center;
}
</style>
