<template>
  <AppLayout :title="inspectionType === 'post-trip' ? store.t('postTripInspection') : store.t('preTripInspection')">
    <RouterLink to="/driver" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('back') }}
    </RouterLink>

    <!-- Vehicle & info strip -->
    <div class="card p-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('vehicle') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ vehicleLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('driver') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ driverLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('dateLabel') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ inspectionDateLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('odometer') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ odometerLabel }}</span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="card p-4 mb-4">
      <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <span>{{ doneCount }} / {{ items.length }} {{ store.t('checked') }}</span>
        <span class="font-semibold text-blue-600 dark:text-blue-400">{{ progress }}%</span>
      </div>
      <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }" />
      </div>
      <div class="flex items-center justify-between mt-2">
        <div class="flex gap-4 text-xs">
          <span class="text-green-600 dark:text-green-400">{{ passCount }} {{ store.t('okLabel') }}</span>
          <span class="text-red-500 dark:text-red-400">{{ failCount }} {{ store.t('issuesLabel') }}</span>
        </div>
        <button @click="markAllPass"
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border-2 transition-all"
          :class="allPass ? 'bg-green-500 border-green-500 text-white' : 'border-green-300 text-green-600 dark:border-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'">
          <CheckCheck :size="13" /> {{ store.t('markAllOk') }}
        </button>
      </div>
    </div>

    <!-- Checklist -->
    <div class="card divide-y divide-gray-100 dark:divide-gray-700 mb-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="p-4"
        :class="validationErrors[item.id] ? 'bg-red-50/60 dark:bg-red-900/10' : ''"
      >
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="flex items-center gap-3 flex-1 min-w-0 text-left"
            @click="toggleExpanded(item.id)"
          >
            <component :is="item.icon" :size="18" class="flex-shrink-0"
              :class="item.state === 'pass' ? 'text-green-500' : item.state === 'fail' ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'" />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.title }}</span>
                <span v-if="item.category" class="badge-gray">{{ item.category }}</span>
                <span v-if="item.isRequired" class="badge-blue">Required</span>
                <span v-if="item.requiresPhoto" class="badge-orange">Photo</span>
              </div>
              <p v-if="validationErrors[item.id]" class="text-xs text-red-500 dark:text-red-400 mt-1">
                {{ validationErrors[item.id] }}
              </p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ isExpanded(item.id) ? 'Hide details' : 'Open details' }}
              </p>
            </div>
          </button>
          <div class="flex gap-2 flex-shrink-0">
            <button @click.stop="setState(item, 'pass')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'pass' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-500'">
              <Check :size="16" />
            </button>
            <button @click.stop="setState(item, 'fail')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'fail' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-500'">
              <X :size="16" />
            </button>
            <button @click.stop="setState(item, 'not_applicable')"
              class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border-2"
              :class="item.state === 'not_applicable' ? 'bg-gray-500 border-gray-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-600'">
              N/A
            </button>
          </div>
        </div>

        <Transition name="slide">
          <div v-if="isExpanded(item.id)" class="mt-3 ml-7 space-y-3">
            <p v-if="item.description" class="text-sm text-gray-600 dark:text-gray-300">
              {{ item.description }}
            </p>

            <textarea
              v-model="item.comment"
              :placeholder="item.state === 'fail' ? store.t('describeIssue') : 'Add a comment'"
              rows="3"
              class="w-full text-sm input-field resize-none"
              :class="item.state === 'fail' ? 'placeholder-red-300 dark:placeholder-red-700 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''"
            />
            <div class="flex items-center gap-3 mt-2">
              <label class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                <Camera :size="13" /> {{ store.t('addPhoto') }}
                <input type="file" accept="image/*" multiple class="sr-only" @change="addPhotos(item, $event)" />
              </label>
              <div v-if="item.photos.length" class="flex gap-1.5">
                <div v-for="(url, pi) in item.photos" :key="pi" class="relative">
                  <img :src="url" alt="" class="w-10 h-10 rounded-lg object-cover border border-red-200 dark:border-red-800" />
                  <button @click="item.photos.splice(pi, 1)" class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <X :size="7" />
                  </button>
                </div>
              </div>
            </div>
            <p v-if="item.requiresPhoto" class="text-xs text-gray-500 dark:text-gray-400">
              This item requires at least one photo before submit.
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Submit -->
    <p v-if="draftMessage" class="mb-3 text-sm text-green-600 dark:text-green-400">
      {{ draftMessage }}
    </p>
    <div class="flex gap-3 pb-4">
      <button
        class="btn-secondary flex-1 py-3 text-sm"
        :disabled="savingDraft"
        @click="handleSaveDraft"
      >
        {{ savingDraft ? 'Saving...' : store.t('saveDraft') }}
      </button>
      <button @click="handleSubmit" class="btn-primary flex-1 py-3 text-sm">{{ store.t('submitInspection') }}</button>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, Check, CheckCheck, X, FileText } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { useDriverVehicleStore } from '@/stores/driverVehicleStore'
import { supabase } from '@/lib/supabase'
import AppLayout from '../components/layout/AppLayout.vue'
import { formatDateTime } from '@/lib/dateFormat'

const props = defineProps<{ isPostTrip?: boolean }>()
const store = useAppStore()
const vehicleStore = useDriverVehicleStore()
const router = useRouter()
const route = useRoute()

type State = 'pass' | 'fail' | 'not_applicable' | null
interface Item {
  id: string
  title: string
  description: string | null
  category: string | null
  isRequired: boolean
  requiresPhoto: boolean
  sortOrder: number
  icon: unknown
  state: State
  comment: string
  photos: string[]
}

const inspection = ref<any | null>(null)
const items = reactive<Item[]>([])
const expandedIds = ref<Set<string>>(new Set())
const validationErrors = ref<Record<string, string>>({})
const savingDraft = ref(false)
const draftMessage = ref('')

onMounted(loadInspectionItems)

const inspectionType = computed<'pre-trip' | 'post-trip'>(() =>
  inspection.value?.type === 'post-trip' || props.isPostTrip ? 'post-trip' : 'pre-trip'
)

function setState(item: Item, s: State) {
  item.state = item.state === s ? null : s
  delete validationErrors.value[item.id]
}

function toggleExpanded(itemId: string) {
  const next = new Set(expandedIds.value)
  if (next.has(itemId)) next.delete(itemId)
  else next.add(itemId)
  expandedIds.value = next
}

function isExpanded(itemId: string) {
  return expandedIds.value.has(itemId)
}

async function addPhotos(item: Item, event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const urls = await Promise.all(files.map(readFileAsDataUrl))
  item.photos.push(...urls)
  delete validationErrors.value[item.id]
  input.value = ''
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function markAllPass() {
  items.forEach(i => { i.state = 'pass' })
}

async function loadInspectionItems() {
  const inspectionId = String(route.query.inspectionId || '')
  if (!inspectionId) return

  const { data: inspectionData, error: inspectionError } = await supabase
    .from('inspections')
    .select(`
      id,
      company_id,
      type,
      status,
      created_at,
      odometer,
      vehicle_id,
      driver_id,
      vehicles (
        unit,
        make,
        model,
        odometer
      ),
      drivers (
        name
      )
    `)
    .eq('id', inspectionId)
    .single()

  if (!inspectionError) inspection.value = inspectionData

  const { data, error } = await supabase
    .from('inspection_results')
    .select(`
      id,
      result,
      comment,
      photo_urls,
      inspection_template_items (
        title,
        description,
        category,
        is_required,
        requires_photo,
        sort_order
      )
    `)
    .eq('inspection_id', inspectionId)

  if (error || !data?.length) return

  items.splice(
    0,
    items.length,
    ...data.map((result: any) => ({
      id: result.id,
      title: result.inspection_template_items?.title || 'Checklist item',
      description: result.inspection_template_items?.description || null,
      category: result.inspection_template_items?.category || null,
      isRequired: Boolean(result.inspection_template_items?.is_required),
      requiresPhoto: Boolean(result.inspection_template_items?.requires_photo),
      sortOrder: result.inspection_template_items?.sort_order || 0,
      icon: FileText,
      state: ['pass', 'fail', 'not_applicable'].includes(result.result) ? result.result : null,
      comment: result.comment || '',
      photos: result.photo_urls || [],
    })).sort((a: Item, b: Item) => a.sortOrder - b.sortOrder)
  )
}

const allPass  = computed(() => items.every(i => i.state === 'pass'))
const doneCount = computed(() => items.filter(i => i.state !== null).length)
const passCount = computed(() => items.filter(i => i.state === 'pass').length)
const failCount = computed(() => items.filter(i => i.state === 'fail').length)
const progress  = computed(() => items.length ? Math.round((doneCount.value / items.length) * 100) : 0)
const vehicleLabel = computed(() => {
  const vehicle = Array.isArray(inspection.value?.vehicles)
    ? inspection.value.vehicles[0]
    : inspection.value?.vehicles
  const name = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()
  return [name, vehicle?.unit ? `#${vehicle.unit}` : ''].filter(Boolean).join(' · ') || '—'
})
const driverLabel = computed(() => {
  const driver = Array.isArray(inspection.value?.drivers)
    ? inspection.value.drivers[0]
    : inspection.value?.drivers
  return driver?.name || '—'
})
const inspectionDateLabel = computed(() =>
  formatDateTime(inspection.value?.created_at, store.language)
)
const odometerLabel = computed(() => {
  const vehicle = Array.isArray(inspection.value?.vehicles)
    ? inspection.value.vehicles[0]
    : inspection.value?.vehicles
  const value = inspection.value?.odometer ?? vehicle?.odometer
  return value != null ? `${Number(value).toLocaleString()} mi` : '—'
})

async function handleSubmit() {
  const inspectionId = String(route.query.inspectionId || '')
  const vehicleId = String(route.query.vehicleId || '')

  if (inspectionId && vehicleId) {
    if (!validateInspection()) return
    await saveInspectionResults()
    await createIssuesForFailedResults(inspectionId)
    await vehicleStore.completeInspection(
      inspectionId,
      vehicleId,
      inspectionType.value,
      failCount.value > 0
    )
  }

  store.setInspectionResult(failCount.value > 0 ? 'fail' : 'pass')
  router.push(inspectionId ? `/inspect/result?inspectionId=${inspectionId}` : '/inspect/result')
}

async function handleSaveDraft() {
  const inspectionId = String(route.query.inspectionId || '')
  if (!inspectionId) return

  savingDraft.value = true
  draftMessage.value = ''

  try {
    await saveInspectionResults()
    const { error } = await supabase
      .from('inspections')
      .update({ status: 'draft' })
      .eq('id', inspectionId)

    if (error) throw error
    draftMessage.value = 'Draft saved.'
    window.setTimeout(() => {
      router.push('/driver/reports')
    }, 500)
  } catch (error) {
    console.error('[PreTripInspection] failed to save draft', error)
    draftMessage.value = 'Draft could not be saved.'
  } finally {
    savingDraft.value = false
  }
}

function validateInspection() {
  const errors: Record<string, string> = {}

  for (const item of items) {
    if (item.isRequired && !item.state) {
      errors[item.id] = 'Select a result for this required item.'
    } else if (item.requiresPhoto && item.photos.length === 0) {
      errors[item.id] = 'Upload at least one photo for this item.'
    }
  }

  validationErrors.value = errors
  const firstInvalidId = Object.keys(errors)[0]
  if (firstInvalidId) {
    const next = new Set(expandedIds.value)
    next.add(firstInvalidId)
    expandedIds.value = next
    return false
  }

  return true
}

async function saveInspectionResults() {
  const rows = items
    .filter((item) => item.id)
    .map((item) =>
      supabase
        .from('inspection_results')
        .update({
          result: item.state,
          comment: item.comment || null,
          photo_urls: item.photos,
        })
        .eq('id', item.id)
    )

  const results = await Promise.all(rows)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}

async function createIssuesForFailedResults(inspectionId: string) {
  const failedItems = items.filter((item) => item.state === 'fail')
  if (!failedItems.length || !inspection.value) return

  const rows = failedItems.map((item) => ({
    company_id: inspection.value.company_id,
    vehicle_id: inspection.value.vehicle_id,
    driver_id: inspection.value.driver_id,
    inspection_id: inspectionId,
    inspection_result_id: item.id,
    status: 'under-review',
    photo_urls: item.photos,
    title: item.title,
    description: item.comment || item.description || item.title,
  }))

  const { error } = await supabase
    .from('issues')
    .upsert(rows, { onConflict: 'inspection_result_id' })
  if (error) {
    console.error('[PreTripInspection] failed to create inspection issues', error)
  }
}

</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
