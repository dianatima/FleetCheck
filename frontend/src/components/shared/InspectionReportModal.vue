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
                    <p class="text-xs text-gray-500 dark:text-gray-400">Item {{ photo.sortOrder }}</p>
                    <p v-if="photo.comment" class="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{{ photo.comment }}</p>
                  </div>
                </button>
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
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'

const props = defineProps<{
  modelValue: boolean
  inspectionId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const store = useAppStore()
const loading = ref(false)
const error = ref<string | null>(null)
const inspection = ref<any | null>(null)
const results = ref<any[]>([])
const photoLightboxOpen = ref(false)
const lightboxPhotos = ref<string[]>([])
const lightboxStartIndex = ref(0)

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
    (row.photoUrls || []).map((url: string) => ({
      url,
      rowId: row.id,
      title: row.title,
      result: row.result,
      comment: row.comment,
      sortOrder: row.sortOrder,
    }))
  )
})

function close() {
  emit('update:modelValue', false)
}

async function fetchInspection(inspectionId: string) {
  loading.value = true
  error.value = null
  inspection.value = null
  results.value = []

  const { data, error: inspectionError } = await supabase
    .from('inspections')
    .select(`
      id,
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
      drivers (
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

  if (inspectionError || !data) {
    error.value = inspectionError?.message || 'Inspection details could not be loaded.'
    loading.value = false
    return
  }

  inspection.value = data
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

  loading.value = false
}

function openPhotoLightbox(index: number) {
  lightboxPhotos.value = galleryPhotos.value.map((photo) => photo.url)
  lightboxStartIndex.value = index
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