<template>
  <AppLayout title="Report Details">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <RouterLink :to="backPath" class="back-link !mb-0">
        <ArrowLeft :size="16" />
        Back to Reports
      </RouterLink>
      <div v-if="inspection" class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn-secondary gap-2 text-sm"
          :disabled="pdfAction === 'preview'"
          @click="runPdfAction('preview')"
        >
          <Eye :size="15" />
          {{ pdfAction === 'preview' ? store.t('opening') : store.t('previewPdf') }}
        </button>
        <button
          type="button"
          class="btn-secondary gap-2 text-sm"
          :disabled="pdfAction === 'share'"
          @click="runPdfAction('share')"
        >
          <Share2 :size="15" />
          {{ pdfAction === 'share' ? store.t('sharing') : store.t('shareCopy') }}
        </button>
        <button
          type="button"
          class="btn-secondary gap-2 text-sm"
          :disabled="pdfAction === 'download'"
          @click="runPdfAction('download')"
        >
          <Download :size="15" />
          {{ pdfAction === 'download' ? store.t('preparingPdf') : `${store.t('download')} ${store.t('pdf')}` }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card p-6 text-sm text-gray-500">
      Loading report...
    </div>
    <div v-else-if="error" class="card p-6 text-sm text-red-500">
      {{ error }}
    </div>
    <template v-else-if="inspection">
      <RouterLink :to="vehiclePath" class="card report-summary-card group">
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

        <div class="summary-main">
          <h2 class="summary-title">
            {{ vehicleName }}
          </h2>
          <p class="summary-line">
            {{ vehicle?.unit ? `Unit ${vehicle.unit}` : 'Unit —' }} · Plate {{ vehicle?.plate || '—' }}
          </p>
          <p class="summary-line">
            {{ typeLabel }} · {{ submittedLabel }}
          </p>
        </div>

        <div class="summary-meta">
          <div class="meta-row">
            <span>Driver:</span>
            <strong>{{ driverLabel }}</strong>
          </div>
          <div class="meta-row">
            <span>Status:</span>
            <strong class="capitalize">{{ inspection.status || '—' }}</strong>
          </div>
          <div class="meta-row">
            <span>Photos:</span>
            <strong>{{ photoCount }}</strong>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <span :class="vehicleStatusBadge">{{ vehicleStatusLabel }}</span>
            <span :class="reportResultBadge">{{ reportResultLabel }}</span>
            <span class="view-vehicle-inline">
              View vehicle <ChevronRight :size="14" />
            </span>
          </div>
        </div>
      </RouterLink>

      <section class="card mb-5">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Checklist Items</h3>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          <div v-for="row in results" :key="row.id" class="p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ row.inspection_template_items?.title || 'Checklist item' }}
                  </p>
                  <span v-if="row.inspection_template_items?.inspection_item_categories?.name" class="badge-gray">
                    {{ row.inspection_template_items.inspection_item_categories.name }}
                  </span>
                  <span
                    v-if="row.inspection_template_items?.inspection_item_categories?.severity"
                    :class="severityBadge(row.inspection_template_items.inspection_item_categories.severity)"
                  >
                    {{ severityLabel(row.inspection_template_items.inspection_item_categories.severity) }}
                  </span>
                  <span v-if="row.inspection_template_items?.is_required" class="badge-blue">Required</span>
                  <span v-if="row.inspection_template_items?.requires_photo" class="badge-orange">Photo</span>
                </div>
                <p v-if="row.inspection_template_items?.description" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ row.inspection_template_items.description }}
                </p>
              </div>
              <span :class="resultBadge(row.result)">{{ resultLabel(row.result) }}</span>
            </div>

            <p v-if="row.comment" class="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              {{ row.comment }}
            </p>

            <div v-if="(row.photo_urls_normalized || row.photo_urls)?.length" class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="(url, index) in (row.photo_urls_normalized || row.photo_urls)"
                :key="`${row.id}-${index}`"
                type="button"
                class="photo-thumb"
                @click="openPhotoLightbox(row.photo_urls_normalized || row.photo_urls, index)"
              >
                <img :src="url" alt="" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="card mb-5">
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Issues</h3>
        </div>
        <div v-if="issues.length === 0" class="p-4 text-sm text-gray-500 dark:text-gray-400">
          No issues were generated for this inspection.
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <div v-for="issue in issues" :key="issue.id" class="p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ issue.title || 'Inspection issue' }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <span :class="severityBadge(issue.severity)">{{ severityLabel(issue.severity) }}</span>
                <span class="badge-red">{{ issue.status || 'under-review' }}</span>
              </div>
            </div>
            <p v-if="issue.description" class="text-sm text-gray-600 dark:text-gray-300 mt-2">{{ issue.description }}</p>
            <div v-if="(issue.photo_urls_normalized || issue.photo_urls)?.length" class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="(url, index) in (issue.photo_urls_normalized || issue.photo_urls)"
                :key="`${issue.id}-${index}`"
                type="button"
                class="photo-thumb"
                @click="openPhotoLightbox(issue.photo_urls_normalized || issue.photo_urls, index)"
              >
                <img :src="url" alt="" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <PhotoLightbox
      v-model="photoLightboxOpen"
      :photos="lightboxPhotos"
      :start-index="lightboxStartIndex"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ChevronRight, Download, Eye, Share2, Truck } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import PhotoLightbox from '@/components/shared/PhotoLightbox.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'
import { downloadInspectionReportPdf, previewInspectionReportPdf, shareInspectionReportPdf } from '@/lib/reportPdf'
import { normalizePhotoUrls } from '@/lib/photoUrls'

const route = useRoute()
const store = useAppStore()
const authStore = useAuthStore()
const inspection = ref<any | null>(null)
const results = ref<any[]>([])
const issues = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pdfAction = ref<'download' | 'preview' | 'share' | null>(null)
const photoLightboxOpen = ref(false)
const lightboxPhotos = ref<string[]>([])
const lightboxStartIndex = ref(0)
const backPath = computed(() => route.path.startsWith('/reports/') ? '/reports' : '/driver/reports')

onMounted(loadReport)

const passed = computed(() => results.value.every((row) => row.result !== 'fail'))
const photoCount = computed(() =>
  results.value.reduce((count, row) => count + ((row.photo_urls_normalized || row.photo_urls || []).length || 0), 0)
)
const vehicle = computed(() => {
  return Array.isArray(inspection.value?.vehicles) ? inspection.value.vehicles[0] : inspection.value?.vehicles
})
const vehicleName = computed(() => {
  const vehicleValue = vehicle.value
  return `${vehicleValue?.make || ''} ${vehicleValue?.model || ''}`.trim() || 'Vehicle'
})
const driverLabel = computed(() => {
  const driver = Array.isArray(inspection.value?.drivers) ? inspection.value.drivers[0] : inspection.value?.drivers
  return driver?.name || '—'
})
const typeLabel = computed(() => inspection.value?.type === 'post-trip' ? 'Post-trip' : 'Pre-trip')
const submittedLabel = computed(() => formatDate(inspection.value?.submitted_at || inspection.value?.created_at))
const reportResultLabel = computed(() => passed.value ? 'Pass' : 'Failed')
const reportResultBadge = computed(() => passed.value ? 'badge-green' : 'badge-red')
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

async function loadReport() {
  const inspectionId = String(route.params.inspectionId || '')
  if (!inspectionId) return

  loading.value = true
  error.value = null

  const { data, error: inspectionError } = await supabase
    .from('inspections')
    .select(`
      id,
      type,
      status,
      created_at,
      submitted_at,
      vehicle_id,
      driver_id,
      vehicles (
        id,
        unit,
        make,
        model,
        plate,
        vin,
        odometer,
        status,
        photo_url
      ),
      drivers!inspections_driver_id_fkey (
        name,
        email,
        phone
      ),
      inspection_results (
        id,
        result,
        comment,
        photo_urls,
        inspection_template_items (
          title,
          description,
          category_id,
          inspection_item_categories (
            id,
            name,
            severity
          ),
          is_required,
          requires_photo,
          sort_order
        )
      ),
      issues (
        id,
        title,
        description,
        severity,
        status,
        photo_urls,
        inspection_result_id
      )
    `)
    .eq('id', inspectionId)
    .single()

  if (inspectionError || !data) {
    error.value = inspectionError?.message || 'Report was not found.'
    loading.value = false
    return
  }

  inspection.value = data
  results.value = [...(data.inspection_results || [])]
    .map((row: any) => ({
      ...row,
      photo_urls_normalized: normalizePhotoUrls(row.photo_urls),
    }))
    .sort(
      (a: any, b: any) =>
        (a.inspection_template_items?.sort_order || 0) - (b.inspection_template_items?.sort_order || 0)
    )
  issues.value = (data.issues || []).map((issue: any) => ({
    ...issue,
    photo_urls_normalized: normalizePhotoUrls(issue.photo_urls),
  }))
  loading.value = false
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language)
}

async function runPdfAction(action: 'download' | 'preview' | 'share') {
  if (!inspection.value?.id) return
  pdfAction.value = action
  error.value = null

  try {
    if (action === 'preview') {
      await previewInspectionReportPdf(inspection.value.id, store.language)
    } else if (action === 'share') {
      await shareInspectionReportPdf(inspection.value.id, store.language)
    } else {
      await downloadInspectionReportPdf(inspection.value.id, store.language)
    }
  } catch (downloadError: any) {
    error.value = downloadError?.message || store.t('reportPdfActionFailed')
  } finally {
    pdfAction.value = null
  }
}

function resultLabel(result: string) {
  if (result === 'pass') return 'Pass'
  if (result === 'fail') return 'Fail'
  return 'N/A'
}

function resultBadge(result: string) {
  if (result === 'pass') return 'badge-green'
  if (result === 'fail') return 'badge-red'
  return 'badge-gray'
}

function severityLabel(severity: string | null) {
  return {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  }[severity || 'medium'] || 'Medium'
}

function severityBadge(severity: string | null) {
  return {
    low: 'badge-green',
    medium: 'badge-orange',
    high: 'badge-red',
  }[severity || 'medium'] || 'badge-orange'
}

function hideBrokenImage(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
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
.back-link {
  @apply flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors;
}

.report-summary-card {
  @apply p-4 mb-5 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/40 cursor-pointer;
}

.vehicle-photo {
  @apply w-full md:w-24 h-32 md:h-20 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0;
}

.summary-main {
  @apply flex-1 min-w-0;
}

.summary-title {
  @apply text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate;
}

.summary-line {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-0.5;
}

.summary-meta {
  @apply md:w-80 flex flex-col gap-1.5 text-sm text-gray-500 dark:text-gray-400 md:text-right;
}

.meta-row {
  @apply flex items-center justify-between md:justify-end gap-2;
}

.meta-row strong {
  @apply text-gray-900 dark:text-white font-semibold;
}

.view-vehicle-inline {
  @apply inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400;
}

.photo-thumb {
  @apply w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:opacity-90 dark:border-gray-700 dark:bg-gray-800;
}
</style>
