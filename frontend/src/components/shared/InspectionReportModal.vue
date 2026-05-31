<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      @click.self="close"
    >
      <div class="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-gray-800 sm:px-5">
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Inspection Report</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">Report view combines all photos, while checklist order follows the template.</p>
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            @click="close"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="space-y-4 p-4 sm:p-5">
          <div v-if="loading" class="text-sm text-gray-500">Loading inspection report...</div>
          <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>
          <template v-else-if="inspection">
            <div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p class="text-gray-400">Vehicle</p>
                <p class="font-semibold text-gray-800 dark:text-gray-100">{{ vehicleLabel }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p class="text-gray-400">Type</p>
                <p class="font-semibold text-gray-800 dark:text-gray-100">{{ typeLabel }}</p>
              </div>
              <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p class="text-gray-400">Result</p>
                <p>
                  <span :class="overallResultClass" class="text-xs">{{ overallResultLabel }}</span>
                </p>
              </div>
              <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <p class="text-gray-400">Submitted</p>
                <p class="font-semibold text-gray-800 dark:text-gray-100">{{ submittedLabel }}</p>
              </div>
            </div>

            <section class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div>
                  <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Driver Signature</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Captured when the driver submitted the inspection.</p>
                </div>
              </div>

              <div class="p-4">
                <div
                  v-if="inspection.signature_data_url"
                  class="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <img
                    :src="inspection.signature_data_url"
                    alt="Driver signature"
                    class="h-32 w-full rounded-lg border border-gray-100 object-contain bg-white dark:border-gray-800"
                  />
                  <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Signed by {{ signerLabel }} at {{ signedAtLabel }}
                  </p>
                </div>
                <div v-else class="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No driver signature was attached to this report.
                </div>
              </div>
            </section>

            <section class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div>
                  <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Photos</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">All report photos are collected here. Click any photo to enlarge it.</p>
                </div>
                <span class="badge-gray text-xs">{{ galleryPhotos.length }} photos</span>
              </div>

              <div v-if="galleryPhotos.length === 0" class="p-4 text-sm text-gray-500">No photos were attached to this report.</div>
              <div v-else class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  v-for="(photo, index) in galleryPhotos"
                  :key="`${photo.rowId}-${index}`"
                  type="button"
                  class="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                  @click="openPhotoLightbox(index)"
                >
                  <img :src="photo.url" alt="" class="h-44 w-full object-cover" />
                  <div class="space-y-1 p-3">
                    <div class="flex items-start justify-between gap-2">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ photo.title }}</p>
                      <span :class="resultPillClass(photo.result)" class="text-[11px] whitespace-nowrap">{{ resultValueLabel(photo.result) }}</span>
                    </div>
                    <div v-if="photo.verification" class="flex items-center justify-between gap-2">
                      <span :class="fraudLevelClass(photo.verification.risk_level || photo.verification.verification_status)" class="text-[11px] whitespace-nowrap">
                        {{ fraudLevelLabel(photo.verification.risk_level || photo.verification.verification_status) }}
                      </span>
                      <span class="text-[11px] text-gray-500 dark:text-gray-400">{{ store.t('antiFraudRisk') }} {{ photo.verification.risk_score || 0 }}/100</span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Item {{ photo.sortOrder }}</p>
                    <p v-if="photo.comment" class="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{{ photo.comment }}</p>
                  </div>
                </button>
              </div>
            </section>

            <section v-if="canViewFraudInsights" class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div>
                  <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.t('antiFraudSummaryTitle') }}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('antiFraudSummaryHint') }}</p>
                </div>
                <span class="badge-gray text-xs">{{ fraudSummary.total }} {{ store.t('antiFraudAnalyzed') }}</span>
              </div>

              <div class="space-y-4 p-4">
                <div v-if="fraudLoadError" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200">
                  {{ fraudLoadError }}
                </div>
                <div v-else-if="fraudSummary.total === 0" class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('antiFraudNoRecords') }}</div>

                <template v-else>
                  <div class="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                    <div class="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                      <p class="text-gray-400">{{ store.t('antiFraudMaxRisk') }}</p>
                      <p class="font-semibold text-gray-800 dark:text-gray-100">{{ fraudSummary.maxRisk }}/100</p>
                    </div>
                    <div class="rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
                      <p class="text-red-400">{{ store.t('antiFraudHighRisk') }}</p>
                      <p class="font-semibold text-red-700 dark:text-red-300">{{ fraudSummary.highRisk }}</p>
                    </div>
                    <div class="rounded-xl bg-orange-50 p-3 dark:bg-orange-900/20">
                      <p class="text-orange-400">{{ store.t('antiFraudSuspicious') }}</p>
                      <p class="font-semibold text-orange-700 dark:text-orange-300">{{ fraudSummary.suspicious }}</p>
                    </div>
                    <div class="rounded-xl bg-yellow-50 p-3 dark:bg-yellow-900/20">
                      <p class="text-yellow-500">{{ store.t('antiFraudNeedsReview') }}</p>
                      <p class="font-semibold text-yellow-700 dark:text-yellow-300">{{ fraudSummary.needsReview }}</p>
                    </div>
                    <div class="rounded-xl bg-green-50 p-3 dark:bg-green-900/20">
                      <p class="text-green-500">{{ store.t('antiFraudOk') }}</p>
                      <p class="font-semibold text-green-700 dark:text-green-300">{{ fraudSummary.ok }}</p>
                    </div>
                  </div>

                  <div v-if="fraudSummary.topFlags.length" class="space-y-2">
                    <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ store.t('antiFraudTopReasons') }}</p>
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="flag in fraudSummary.topFlags" :key="flag" class="badge-gray text-[11px]">
                        {{ fraudFlagLabel(flag) }}
                      </span>
                    </div>
                  </div>

                  <div v-if="suspiciousPhotos.length" class="space-y-2">
                    <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ store.t('antiFraudMostSuspiciousPhotos') }}</p>
                    <div class="space-y-2">
                      <div
                        v-for="row in suspiciousPhotos"
                        :key="row.id"
                        class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800/60"
                      >
                        <div class="flex items-center justify-between gap-2">
                          <span class="font-medium text-gray-800 dark:text-gray-100">Item {{ row.photo_index + 1 }} · {{ store.t('antiFraudRisk') }} {{ row.risk_score || 0 }}/100</span>
                          <span :class="fraudLevelClass(row.risk_level || row.verification_status)" class="text-[11px] whitespace-nowrap">
                            {{ fraudLevelLabel(row.risk_level || row.verification_status) }}
                          </span>
                        </div>
                        <p class="mt-1 text-[11px] font-medium text-gray-700 dark:text-gray-200">
                          {{ fraudVerdict(row) }}
                        </p>
                        <ul class="mt-1 space-y-1 text-gray-600 dark:text-gray-300">
                          <li v-for="flag in (row.flags || [])" :key="`${row.id}-${flag}`">• {{ fraudFlagLabel(flag) }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div v-if="duplicateComparisonRows.length" class="space-y-2">
                    <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ store.t('antiFraudPreviousVsCurrent') }}</p>
                    <div class="space-y-3">
                      <div
                        v-for="(pair, pairIndex) in duplicateComparisonRows"
                        :key="`${pair.current.id}-${pairIndex}`"
                        class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60"
                      >
                        <div class="mb-2 flex items-center justify-between gap-2 text-xs">
                          <span class="font-medium text-gray-800 dark:text-gray-100">
                            {{ pair.duplicateType === 'exact' ? store.t('antiFraudExactDuplicate') : store.t('antiFraudVisualDuplicate') }} · {{ store.t('antiFraudRisk') }} {{ pair.current.risk_score || 0 }}/100
                          </span>
                          <span :class="fraudLevelClass(pair.current.risk_level || pair.current.verification_status)" class="text-[11px] whitespace-nowrap">
                            {{ fraudLevelLabel(pair.current.risk_level || pair.current.verification_status) }}
                          </span>
                        </div>
                        <p class="mb-2 text-[11px] font-medium text-gray-700 dark:text-gray-200">
                          {{ fraudVerdict(pair.current) }}
                        </p>
                        <p class="mb-2 text-[11px] text-gray-600 dark:text-gray-300">
                          {{ duplicateOriginSummary(pair.previous) }}
                        </p>

                        <div class="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            class="overflow-hidden rounded-lg border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900"
                            @click="openPairPhotoLightbox(pair, 'previous')"
                          >
                            <img :src="pair.previous.photo_url" alt="Previous report photo" class="h-36 w-full object-cover" />
                            <p class="px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400">{{ store.t('antiFraudPreviousPhoto') }}</p>
                          </button>

                          <button
                            type="button"
                            class="overflow-hidden rounded-lg border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900"
                            @click="openPairPhotoLightbox(pair, 'current')"
                          >
                            <img :src="pair.current.photo_url" alt="Current report photo" class="h-36 w-full object-cover" />
                            <p class="px-2 py-1 text-[11px] text-gray-500 dark:text-gray-400">{{ store.t('antiFraudCurrentPhoto') }}</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </section>

            <section class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <div>
                  <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Checklist Summary</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Items stay in template order, but the report is shown as one combined view.</p>
                </div>
                <span class="badge-gray text-xs">{{ results.length }} items</span>
              </div>

              <div v-if="results.length === 0" class="p-4 text-sm text-gray-500">No inspection items found.</div>
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                <div v-for="row in results" :key="row.id" class="grid gap-3 px-4 py-3 sm:grid-cols-[auto,1fr,auto] sm:items-start">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {{ row.sortOrder }}
                    </span>
                  </div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ row.title }}</p>
                      <span v-if="row.category" class="badge-gray text-[11px]">{{ row.category }}</span>
                      <span v-if="row.requiresPhoto" class="badge-orange text-[11px]">Photo</span>
                    </div>
                    <p v-if="row.comment" class="mt-1 text-xs text-gray-600 dark:text-gray-300">{{ row.comment }}</p>
                    <p v-if="row.photoCount" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ row.photoCount }} photo{{ row.photoCount === 1 ? '' : 's' }}</p>
                  </div>
                  <div class="sm:text-right">
                    <span :class="resultPillClass(row.result)" class="text-xs whitespace-nowrap">{{ resultValueLabel(row.result) }}</span>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>
    </div>

    <PhotoLightbox
      v-model="photoLightboxOpen"
      :photos="lightboxPhotos"
      :start-index="lightboxStartIndex"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import PhotoLightbox from '@/components/shared/PhotoLightbox.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'
import { readSignatureFallback, readSignatureFallbackFromDb } from '@/lib/signatureFallback'
import { analyzeAndStoreInspectionPhotos } from '@/lib/photoFraud'

function isMissingSignatureColumnsError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return (
    value.includes('signature_data_url') ||
    value.includes('signed_at') ||
    value.includes('signed_by_driver_id')
  )
}

const props = defineProps<{
  modelValue: boolean
  inspectionId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const store = useAppStore()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const inspection = ref<any | null>(null)
const results = ref<any[]>([])
const photoVerifications = ref<any[]>([])
const verificationById = ref<Record<string, any>>({})
const fraudLoadError = ref<string | null>(null)
const photoLightboxOpen = ref(false)
const lightboxPhotos = ref<string[]>([])
const lightboxStartIndex = ref(0)

const canViewFraudInsights = computed(() => authStore.role !== 'driver')

watch(
  () => [props.modelValue, props.inspectionId] as const,
  async ([isOpen, inspectionId]) => {
    if (!isOpen || !inspectionId) return
    await fetchInspection(inspectionId)
  },
  { immediate: true }
)

const vehicleLabel = computed(() => {
  const vehicle = relation(inspection.value?.vehicles)
  if (!vehicle) return '—'

  return [
    `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
    vehicle.unit ? `#${vehicle.unit}` : '',
    vehicle.plate || '',
  ]
    .filter(Boolean)
    .join(' · ') || '—'
})

const typeLabel = computed(() =>
  inspection.value?.type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
)

const submittedLabel = computed(() =>
  formatDateTime(inspection.value?.submitted_at || inspection.value?.created_at || null, store.language)
)

const signedAtLabel = computed(() =>
  formatDateTime(inspection.value?.signed_at || inspection.value?.submitted_at || inspection.value?.created_at || null, store.language)
)

const signerLabel = computed(() => {
  const driver = relation(inspection.value?.drivers)
  return driver?.name || driver?.email || 'Driver'
})

const overallResult = computed(() => {
  if (inspection.value?.status === 'draft') return 'draft'
  return results.value.some((row) => row.result === 'fail') ? 'fail' : 'pass'
})

const overallResultClass = computed(() => resultPillClass(overallResult.value))
const overallResultLabel = computed(() => resultValueLabel(overallResult.value))

const galleryPhotos = computed(() => {
  return results.value.flatMap((row) =>
    (row.photoUrls || []).map((url: string, index: number) => ({
      url,
      rowId: row.id,
      photoIndex: index,
      title: row.title,
      result: row.result,
      comment: row.comment,
      sortOrder: row.sortOrder,
      verification: findPhotoVerification(row.id, index),
    }))
  )
})

const fraudSummary = computed(() => {
  const records = photoVerifications.value || []
  if (!records.length) {
    return {
      total: 0,
      maxRisk: 0,
      highRisk: 0,
      suspicious: 0,
      needsReview: 0,
      ok: 0,
      topFlags: [] as string[],
    }
  }

  const counts = {
    highRisk: 0,
    suspicious: 0,
    needsReview: 0,
    ok: 0,
  }
  const flagCounter = new Map<string, number>()
  let maxRisk = 0

  for (const row of records) {
    const risk = Number(row.risk_score || 0)
    if (risk > maxRisk) maxRisk = risk

    const level = String(row.risk_level || row.verification_status || 'ok')
    if (level === 'high-risk') counts.highRisk += 1
    else if (level === 'suspicious') counts.suspicious += 1
    else if (level === 'needs-review') counts.needsReview += 1
    else counts.ok += 1

    for (const flag of Array.isArray(row.flags) ? row.flags : []) {
      flagCounter.set(flag, (flagCounter.get(flag) || 0) + 1)
    }
  }

  const topFlags = [...flagCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flag]) => flag)

  return {
    total: records.length,
    maxRisk,
    highRisk: counts.highRisk,
    suspicious: counts.suspicious,
    needsReview: counts.needsReview,
    ok: counts.ok,
    topFlags,
  }
})

const suspiciousPhotos = computed(() => {
  return photoVerifications.value
    .filter((row) => Number(row.risk_score || 0) > 20)
    .sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0))
    .slice(0, 6)
})

const duplicateComparisonRows = computed(() => {
  return suspiciousPhotos.value
    .map((row) => {
      const referenceId = row.exact_duplicate_of_id || row.visual_duplicate_of_id
      if (!referenceId) return null
      const previous = verificationById.value[String(referenceId)]
      if (!previous?.photo_url || !row.photo_url) return null
      return {
        current: row,
        previous,
        duplicateType: row.exact_duplicate_of_id ? 'exact' : 'visual',
      }
    })
    .filter(Boolean)
})

function displayDriverName(row: any) {
  const driver = relation(row?.drivers)
  if (!driver) return 'Unknown driver'
  return driver.name || driver.email || 'Unknown driver'
}

function displayVehicleLabel(row: any) {
  const vehicle = relation(row?.vehicles)
  if (!vehicle) return `Vehicle ${row?.vehicle_id || 'unknown'}`

  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const unit = vehicle.unit ? `#${vehicle.unit}` : ''
  const plate = vehicle.plate || ''

  return [makeModel, unit, plate].filter(Boolean).join(' · ') || `Vehicle ${row?.vehicle_id || 'unknown'}`
}

function duplicateOriginSummary(row: any) {
  if (!row) return 'Original source record is unavailable.'

  const when = formatDateTime(row.uploaded_at || row.created_at || null, store.language)
  const who = displayDriverName(row)
  const where = displayVehicleLabel(row)

  return `Original first seen: ${when} · ${who} · ${where}`
}

function close() {
  emit('update:modelValue', false)
}

function findPhotoVerification(inspectionResultId: string, photoIndex: number) {
  return photoVerifications.value.find(
    (row) => row.inspection_result_id === inspectionResultId && Number(row.photo_index) === photoIndex
  ) || null
}

function fraudLevelClass(level: string | null) {
  if (level === 'high-risk') return 'badge-red'
  if (level === 'suspicious') return 'badge-orange'
  if (level === 'needs-review') return 'badge-yellow'
  return 'badge-green'
}

function fraudLevelLabel(level: string | null) {
  if (level === 'high-risk') return store.t('antiFraudHighRisk')
  if (level === 'suspicious') return store.t('antiFraudSuspicious')
  if (level === 'needs-review') return store.t('antiFraudNeedsReview')
  return store.t('antiFraudOk')
}

function fraudFlagLabel(flag: string) {
  if (flag === 'EXACT_DUPLICATE') return store.t('antiFraudFlagExactDuplicate')
  if (flag === 'VISUAL_DUPLICATE') return store.t('antiFraudFlagVisualDuplicate')
  if (flag === 'PHOTO_TAKEN_BEFORE_INSPECTION') return store.t('antiFraudFlagOldExif')
  if (flag === 'DEVICE_CHANGED') return store.t('antiFraudFlagDeviceChanged')
  if (flag === 'NO_EXIF') return store.t('antiFraudFlagNoExif')
  if (flag === 'FILE_NAME_REUSED') return store.t('antiFraudFlagFileNameReused')
  if (flag === 'NO_EMBEDDED_BINARY') return 'Photo metadata source is limited (non-data URL input).'
  if (flag === 'ANALYSIS_ERROR') return 'Photo analysis partially failed.'
  return flag
}

function fraudVerdict(row: any) {
  const flags = Array.isArray(row?.flags) ? row.flags : []

  if (flags.includes('EXACT_DUPLICATE')) {
    return store.t('antiFraudVerdictExactDuplicate')
  }

  if (flags.includes('VISUAL_DUPLICATE')) {
    return store.t('antiFraudVerdictVisualDuplicate')
  }

  if (flags.includes('PHOTO_TAKEN_BEFORE_INSPECTION')) {
    return store.t('antiFraudVerdictOldExif')
  }

  if (flags.includes('DEVICE_CHANGED')) {
    return store.t('antiFraudVerdictDeviceChanged')
  }

  if (flags.includes('NO_EXIF')) {
    return store.t('antiFraudVerdictNoExif')
  }

  if (flags.includes('FILE_NAME_REUSED')) {
    return store.t('antiFraudVerdictFileNameReused')
  }

  const score = Number(row?.risk_score || 0)
  if (score > 80) return store.t('antiFraudVerdictHighRisk')
  if (score > 50) return store.t('antiFraudVerdictSuspicious')
  if (score > 20) return store.t('antiFraudVerdictNeedsReview')
  return store.t('antiFraudVerdictNoIndicators')
}

function isMissingPhotoVerificationTableError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return value.includes('inspection_photo_verifications')
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function duplicatePointsToNewerPhoto(row: any, inspectionCreatedAt: string | null | undefined) {
  const inspectionTs = toTimestamp(inspectionCreatedAt)
  if (inspectionTs == null) return false

  const exactTs = toTimestamp(row?.details?.exact_duplicate?.uploaded_at)
  const visualTs = toTimestamp(row?.details?.visual_duplicate?.uploaded_at)

  return (exactTs != null && exactTs > inspectionTs) || (visualTs != null && visualTs > inspectionTs)
}

async function fetchInspection(inspectionId: string) {
  loading.value = true
  error.value = null
  inspection.value = null
  results.value = []
  photoVerifications.value = []
  verificationById.value = {}
  fraudLoadError.value = null

  let { data, error: inspectionError } = await supabase
    .from('inspections')
    .select(`
      id,
      company_id,
      vehicle_id,
      driver_id,
      type,
      status,
      created_at,
      submitted_at,
      signature_data_url,
      signed_at,
      vehicles (
        unit,
        make,
        model,
        plate
      ),
      drivers!inspections_driver_id_fkey (
        name,
        email
      ),
      inspection_results (
        id,
        result,
        comment,
        photo_urls,
        inspection_template_items (
          title,
          sort_order,
          requires_photo,
          inspection_item_categories (
            name
          )
        )
      )
    `)
    .eq('id', inspectionId)
    .single()

  if (inspectionError && isMissingSignatureColumnsError(inspectionError.message)) {
    const retry = await supabase
      .from('inspections')
      .select(`
        id,
        company_id,
        vehicle_id,
        driver_id,
        type,
        status,
        created_at,
        submitted_at,
        vehicles (
          unit,
          make,
          model,
          plate
        ),
        drivers!inspections_driver_id_fkey (
          name,
          email
        ),
        inspection_results (
          id,
          result,
          comment,
          photo_urls,
          inspection_template_items (
            title,
            sort_order,
            requires_photo,
            inspection_item_categories (
              name
            )
          )
        )
      `)
      .eq('id', inspectionId)
      .single()
    data = retry.data as any
    inspectionError = retry.error
  }

  if (inspectionError || !data) {
    error.value = inspectionError?.message || 'Inspection details could not be loaded.'
    loading.value = false
    return
  }

  const localFallbackSignature = readSignatureFallback(inspectionId)
  const fallbackSignature =
    localFallbackSignature || (await readSignatureFallbackFromDb(inspectionId))
  inspection.value = {
    ...data,
    signature_data_url: data?.signature_data_url || fallbackSignature?.dataUrl || null,
    signed_at: data?.signed_at || fallbackSignature?.signedAt || null,
  }
  results.value = relationArray(data.inspection_results)
    .map((row: any) => {
      const item = relation(row.inspection_template_items)
      const photoUrls = (row.photo_urls || []).filter(Boolean)
      return {
        id: row.id,
        title: item?.title || 'Checklist item',
        sortOrder: Number(item?.sort_order || 0),
        category: relation(item?.inspection_item_categories)?.name || '',
        requiresPhoto: Boolean(item?.requires_photo),
        result: row.result,
        comment: row.comment || '',
        photoUrls,
        photoCount: photoUrls.length,
      }
    })
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)

  if (canViewFraudInsights.value) {
    let { data: verificationData, error: verificationError } = await supabase
      .from('inspection_photo_verifications')
      .select('id, inspection_id, photo_url, inspection_result_id, photo_index, risk_score, risk_level, verification_status, flags, exact_duplicate_of_id, visual_duplicate_of_id, details, uploaded_at')
      .eq('inspection_id', inspectionId)

    const shouldRecomputeFraud =
      !verificationError &&
      Array.isArray(verificationData) &&
      verificationData.some((row: any) => duplicatePointsToNewerPhoto(row, inspection.value?.created_at))

    const shouldBackfillFraud =
      !verificationError &&
      Array.isArray(verificationData) &&
      (verificationData.length === 0 || shouldRecomputeFraud)
    if (shouldBackfillFraud) {
      const backfillPhotos = results.value.flatMap((row: any) =>
        (row.photoUrls || []).map((url: string, photoIndex: number) => ({
          inspectionResultId: row.id,
          photoIndex,
          dataUrl: url,
          uploadedAt: inspection.value?.created_at || new Date().toISOString(),
        }))
      )

      const companyId = inspection.value?.company_id
      if (companyId && backfillPhotos.length > 0) {
        try {
          await analyzeAndStoreInspectionPhotos({
            companyId,
            inspectionId,
            driverId: inspection.value?.driver_id || null,
            vehicleId: inspection.value?.vehicle_id || null,
            inspectionCreatedAt: inspection.value?.created_at || null,
            photos: backfillPhotos,
          })

          const reloaded = await supabase
            .from('inspection_photo_verifications')
            .select('id, inspection_id, photo_url, inspection_result_id, photo_index, risk_score, risk_level, verification_status, flags, exact_duplicate_of_id, visual_duplicate_of_id, details, uploaded_at')
            .eq('inspection_id', inspectionId)

          verificationData = reloaded.data
          verificationError = reloaded.error
        } catch (backfillError: any) {
          console.warn('[InspectionReportModal] anti-fraud backfill failed', backfillError)
          fraudLoadError.value = `Anti-fraud backfill failed: ${backfillError?.message || 'unknown error'}`
        }
      }
    }

    if (verificationError) {
      if (!isMissingPhotoVerificationTableError(verificationError.message)) {
        console.warn('[InspectionReportModal] failed to load anti-fraud records', verificationError)
        fraudLoadError.value = 'Anti-fraud records could not be loaded due to permissions or schema mismatch.'
      } else {
        fraudLoadError.value = 'Anti-fraud table is missing in the current database schema.'
      }
      photoVerifications.value = []
    } else {
      photoVerifications.value = Array.isArray(verificationData) ? verificationData : []
      const localMap: Record<string, any> = {}

      for (const row of photoVerifications.value) {
        if (row?.id) localMap[String(row.id)] = row
      }

      const referencedIds = photoVerifications.value
        .flatMap((row) => [row?.exact_duplicate_of_id, row?.visual_duplicate_of_id])
        .filter(Boolean)

      const uniqueReferencedIds = [...new Set(referencedIds)]

      if (uniqueReferencedIds.length) {
        const { data: referenceRows, error: referenceError } = await supabase
          .from('inspection_photo_verifications')
          .select(`
            id,
            inspection_id,
            photo_url,
            risk_score,
            risk_level,
            verification_status,
            uploaded_at,
            created_at,
            driver_id,
            vehicle_id,
            drivers (
              name,
              email
            ),
            vehicles (
              unit,
              make,
              model,
              plate
            )
          `)
          .in('id', uniqueReferencedIds)

        if (referenceError) {
          console.warn('[InspectionReportModal] failed to load duplicate photo references', referenceError)
        } else {
          for (const row of Array.isArray(referenceRows) ? referenceRows : []) {
            if (row?.id) localMap[String(row.id)] = row
          }
        }
      }

      verificationById.value = localMap
    }
  }

  loading.value = false
}

function openPhotoLightbox(index: number) {
  lightboxPhotos.value = galleryPhotos.value.map((photo) => photo.url)
  lightboxStartIndex.value = index
  photoLightboxOpen.value = true
}

function openPairPhotoLightbox(pair: any, target: 'previous' | 'current') {
  const previousUrl = pair?.previous?.photo_url
  const currentUrl = pair?.current?.photo_url
  const photos = [previousUrl, currentUrl].filter(Boolean)
  if (!photos.length) return

  lightboxPhotos.value = photos
  lightboxStartIndex.value = target === 'current' && photos.length > 1 ? 1 : 0
  photoLightboxOpen.value = true
}

function resultPillClass(result: string | null) {
  if (result === 'pass') return 'badge-green'
  if (result === 'fail') return 'badge-red'
  if (result === 'not_applicable') return 'badge-gray'
  return 'badge-yellow'
}

function resultValueLabel(result: string | null) {
  if (result === 'pass') return store.t('statusPassed')
  if (result === 'fail') return store.t('statusFailed')
  if (result === 'not_applicable') return 'N/A'
  return store.t('statusDraft')
}

function relation(value: any) {
  return Array.isArray(value) ? value[0] : value
}

function relationArray(value: any) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
</script>