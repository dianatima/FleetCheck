<template>
  <AppLayout :title="isPostTrip ? store.t('postTripInspection') : store.t('preTripInspection')">
    <RouterLink to="/driver" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('back') }}
    </RouterLink>

    <!-- Vehicle & info strip -->
    <div class="card p-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('vehicle') }}</span>
        <select v-model="selectedVehicleId" class="input-field mt-1 py-2 text-sm min-w-56" :disabled="vehiclesLoading || availableVehicles.length === 0" @change="handleVehicleChange">
          <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.make }} {{ vehicle.model }} · {{ vehicle.unit }}</option>
        </select>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('driver') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ driverDisplayName }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('dateLabel') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ inspectionDateLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('odometer') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ selectedVehicle?.odometer != null ? `${Number(selectedVehicle.odometer).toLocaleString()} ${activeDistanceUnit}` : '—' }}</span>
      </div>
      <div class="min-w-52">
        <span class="text-xs text-gray-400 block">Inspection template</span>
        <select v-model="selectedTemplateId" class="input-field mt-1 py-2 text-sm" :disabled="templatesLoading || templateOptions.length === 0" @change="applySelectedTemplate">
          <option v-for="template in templateOptions" :key="template.id" :value="template.id">{{ template.name }} · {{ template.vehicleType }}</option>
        </select>
      </div>
    </div>

    <div v-if="templateError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {{ templateError }}
    </div>

    <div v-if="submitError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
      {{ submitError }}
    </div>

    <div v-else-if="activeTemplateName" class="card p-4 mb-4 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Active template</p>
          <p class="font-semibold text-gray-900 dark:text-white">{{ activeTemplateName }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span class="badge-blue">{{ activeTemplateVehicleType }}</span>
          <span class="badge-gray">{{ props.isPostTrip ? 'post-trip' : 'pre-trip' }}</span>
          <span class="badge-gray">{{ activeDistanceUnit }}</span>
          <span class="badge-gray">{{ activeDimensionUnit }}</span>
        </div>
      </div>
    </div>

    <div class="card p-4 mb-4 grid md:grid-cols-2 gap-4 text-sm">
      <div>
        <label class="label">Current odometer ({{ activeDistanceUnit }})</label>
        <input v-model.number="currentOdometer" type="number" min="0" step="0.1" class="input-field" />
        <p v-if="selectedVehicle?.odometer != null" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Last recorded: {{ Number(selectedVehicle.odometer).toLocaleString() }} {{ activeDistanceUnit }}
        </p>
      </div>
      <div>
        <label class="label">Current engine hours</label>
        <input v-model.number="currentEngineHours" type="number" min="0" step="0.1" class="input-field" />
        <p v-if="selectedVehicle?.engine_hours != null" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Last recorded: {{ Number(selectedVehicle.engine_hours).toLocaleString() }} hrs
        </p>
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
      <div v-for="item in items" :key="item.id" class="p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <component :is="item.icon" :size="18" class="flex-shrink-0"
              :class="item.state === 'pass' ? 'text-green-500' : item.state === 'fail' ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'" />
            <div class="min-w-0">
              <p v-if="item.section" class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{{ item.section }}</p>
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ item.label }}</span>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="setState(item, 'pass')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'pass' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-500'">
              <Check :size="16" />
            </button>
            <button @click="setState(item, 'fail')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'fail' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-500'">
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- Follow-up -->
        <Transition name="slide">
          <div v-if="item.state === 'fail' || (item.photoEnabled && item.state !== null)" class="mt-3 ml-7 space-y-2">
            <textarea v-if="item.state === 'fail'" v-model="item.note" :placeholder="store.t('describeIssue')" rows="2"
              class="w-full text-sm input-field resize-none placeholder-red-300 dark:placeholder-red-700 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10" />
            <div v-if="item.photoEnabled" class="flex items-center gap-3">
              <button @click="addPhoto(item)" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Camera :size="13" /> {{ store.t('addPhoto') }}
              </button>
              <span v-if="item.photoRequired" class="text-xs text-amber-600 dark:text-amber-300">Photo required</span>
              <div v-if="item.photos.length" class="flex gap-1.5">
                <div v-for="(url, pi) in item.photos" :key="pi" class="relative">
                  <img :src="url" alt="" class="w-10 h-10 rounded-lg object-cover border border-red-200 dark:border-red-800" />
                  <button @click="item.photos.splice(pi, 1)" class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <X :size="7" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Signature -->
    <div class="card p-5 mb-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ store.t('driverSignature') }}</h3>
      <div class="h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <span class="text-sm text-gray-400 dark:text-gray-500">{{ store.t('signHere') }}</span>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex gap-3 pb-4">
      <button class="btn-secondary flex-1 py-3 text-sm">{{ store.t('saveDraft') }}</button>
      <button @click="handleSubmit" class="btn-primary flex-1 py-3 text-sm">{{ store.t('submitInspection') }}</button>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Camera, Check, CheckCheck, X, Gauge, Lightbulb, Disc, Droplets, ShieldCheck, FileText } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/layout/AppLayout.vue'
import { supabase } from '@/lib/supabase'
import { normalizeVehicleType } from '@/lib/vehicleCatalog'
import { defaultDimensionUnitForCountry, defaultDistanceUnitForCountry, type DimensionUnit, type DistanceUnit } from '@/lib/measurementUnits'
import { normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

const props = defineProps<{ isPostTrip?: boolean }>()
const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

type State = 'pass' | 'fail' | null
type VehicleSummary = { id: string; unit: string; type: string; make: string; model: string; plate: string; odometer?: number | null; engine_hours?: number | null; assigned_driver_id?: string | null; assigned_driver_name?: string | null }
interface Item { id: string; section: string; label: string; icon: unknown; state: State; note: string; photos: string[]; required: boolean; photoEnabled: boolean; photoRequired: boolean }
interface TemplateItem { id?: string; section?: string; label: string; required?: boolean; enabled?: boolean; photoEnabled?: boolean; photoRequired?: boolean }
interface TemplateOption { id: string; name: string; vehicleType: string; distanceUnit: DistanceUnit; dimensionUnit: DimensionUnit; items: TemplateItem[] }

const fallbackItems: TemplateItem[] = [
  { id: 'tires', section: 'Tires', label: 'Tires & wheels', required: true, enabled: true, photoEnabled: true, photoRequired: false },
  { id: 'lights', section: 'Lights', label: 'Lights & signals', required: true, enabled: true, photoEnabled: false, photoRequired: false },
  { id: 'brakes', section: 'Brakes', label: 'Brakes', required: true, enabled: true, photoEnabled: false, photoRequired: false },
  { id: 'fluids', section: 'Fluids', label: 'Fluid levels', required: true, enabled: true, photoEnabled: true, photoRequired: false },
  { id: 'safety', section: 'Safety', label: 'Safety equipment', required: true, enabled: true, photoEnabled: false, photoRequired: false },
  { id: 'docs', section: 'Documents', label: 'Documents', required: true, enabled: true, photoEnabled: true, photoRequired: true },
]

const items = ref<Item[]>([])
const templateOptions = ref<TemplateOption[]>([])
const selectedTemplateId = ref('')
const availableVehicles = ref<VehicleSummary[]>([])
const selectedVehicleId = ref('')
const activeTemplateName = ref('')
const activeTemplateVehicleType = ref('')
const activeDistanceUnit = ref<DistanceUnit>(defaultDistanceUnitForCountry(authStore.currentCompany?.country))
const activeDimensionUnit = ref<DimensionUnit>(defaultDimensionUnitForCountry(authStore.currentCompany?.country))
const templatesLoading = ref(false)
const vehiclesLoading = ref(false)
const templateError = ref('')
const submitError = ref('')
const currentOdometer = ref<number | null>(null)
const currentEngineHours = ref<number | null>(null)

const photoUrls = [
  'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=80',
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=80',
]

function iconForItem(section: string, label: string) {
  const lookup = `${section} ${label}`.toLowerCase()

  if (lookup.includes('light')) return Lightbulb
  if (lookup.includes('brake')) return Disc
  if (lookup.includes('fluid') || lookup.includes('oil') || lookup.includes('coolant')) return Droplets
  if (lookup.includes('document') || lookup.includes('registration') || lookup.includes('insurance')) return FileText
  if (lookup.includes('safety') || lookup.includes('seat belt') || lookup.includes('harness')) return ShieldCheck
  return Gauge
}

function buildChecklistItems(templateItems: TemplateItem[]) {
  return templateItems
    .filter((item) => item.enabled !== false)
    .map((item, index) => ({
      id: item.id || `template-item-${index}`,
      section: item.section || 'General',
      label: item.label,
      icon: iconForItem(item.section || '', item.label),
      state: null,
      note: '',
      photos: [],
      required: item.required !== false,
      photoEnabled: item.photoEnabled ?? false,
      photoRequired: item.photoRequired ?? false,
    }))
}

const selectedVehicle = computed(() => availableVehicles.value.find((vehicle) => vehicle.id === selectedVehicleId.value) || null)

const inspectionDateLabel = computed(() => new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date()))

const driverDisplayName = computed(() => {
  const firstName = authStore.profile?.first_name || ''
  const lastName = authStore.profile?.last_name || ''
  return `${firstName} ${lastName}`.trim() || authStore.user?.email || 'Driver'
})

function syncVehicleTelemetry() {
  currentOdometer.value = selectedVehicle.value?.odometer ?? null
  currentEngineHours.value = selectedVehicle.value?.engine_hours ?? null
}

function matchTemplateForVehicleType() {
  const vehicleType = normalizeVehicleType(selectedVehicle.value?.type)
  const matchingTemplate = templateOptions.value.find((template) => normalizeVehicleType(template.vehicleType) === vehicleType)
  selectedTemplateId.value = matchingTemplate?.id || ''
  applySelectedTemplate()
}

function handleVehicleChange() {
  submitError.value = ''
  syncVehicleTelemetry()
  matchTemplateForVehicleType()
}

function applySelectedTemplate() {
  const selectedTemplate = templateOptions.value.find((template) => template.id === selectedTemplateId.value)

  if (!selectedTemplate) {
    items.value = buildChecklistItems(fallbackItems)
    activeTemplateName.value = 'Default checklist'
    activeTemplateVehicleType.value = 'General'
    activeDistanceUnit.value = defaultDistanceUnitForCountry(authStore.currentCompany?.country)
    activeDimensionUnit.value = defaultDimensionUnitForCountry(authStore.currentCompany?.country)
    return
  }

  items.value = buildChecklistItems(selectedTemplate.items)
  activeTemplateName.value = selectedTemplate.name
  activeTemplateVehicleType.value = selectedTemplate.vehicleType
  activeDistanceUnit.value = selectedTemplate.distanceUnit
  activeDimensionUnit.value = selectedTemplate.dimensionUnit
}

async function loadInspectionTemplates() {
  templateError.value = ''

  if (!authStore.companyId) {
    templateOptions.value = []
    selectedTemplateId.value = ''
    applySelectedTemplate()
    return
  }

  templatesLoading.value = true

  const { data, error } = await supabase
    .from('inspection_templates')
    .select('id, name, vehicle_type, distance_unit, dimension_unit, items')
    .eq('company_id', authStore.companyId)
    .eq('inspection_type', props.isPostTrip ? 'post-trip' : 'pre-trip')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    templateError.value = normalizeSupabaseSchemaErrorMessage(error.message) || error.message
    templateOptions.value = []
    selectedTemplateId.value = ''
    applySelectedTemplate()
    templatesLoading.value = false
    return
  }

  templateOptions.value = (data || []).map((template) => ({
    id: template.id,
    name: template.name,
    vehicleType: template.vehicle_type,
    distanceUnit: (template.distance_unit || defaultDistanceUnitForCountry(authStore.currentCompany?.country)) as DistanceUnit,
    dimensionUnit: (template.dimension_unit || defaultDimensionUnitForCountry(authStore.currentCompany?.country)) as DimensionUnit,
    items: Array.isArray(template.items) ? template.items as TemplateItem[] : [],
  }))

  matchTemplateForVehicleType()
  templatesLoading.value = false
}

async function loadVehicles() {
  submitError.value = ''

  if (!authStore.companyId) {
    availableVehicles.value = []
    selectedVehicleId.value = ''
    return
  }

  vehiclesLoading.value = true

  const { data: assignments, error: assignmentsError } = await supabase
    .from('vehicle_company_assignments')
    .select('vehicle_id, assigned_driver_id')
    .eq('company_id', authStore.companyId)

  if (assignmentsError) {
    vehiclesLoading.value = false
    submitError.value = assignmentsError.message
    availableVehicles.value = []
    selectedVehicleId.value = ''
    return
  }

  const vehicleIds = (assignments || []).map((assignment) => assignment.vehicle_id)
  const assignedDriverIds = [...new Set((assignments || []).map((assignment) => assignment.assigned_driver_id).filter(Boolean))]

  if (vehicleIds.length === 0) {
    vehiclesLoading.value = false
    availableVehicles.value = []
    selectedVehicleId.value = ''
    syncVehicleTelemetry()
    return
  }

  const [{ data, error }, { data: drivers, error: driversError }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, unit, type, make, model, plate, odometer, engine_hours')
      .in('id', vehicleIds)
      .order('make', { ascending: true }),
    assignedDriverIds.length
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', assignedDriverIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  vehiclesLoading.value = false

  if (error || driversError) {
    submitError.value = error?.message || driversError?.message || 'Unable to load vehicles.'
    availableVehicles.value = []
    selectedVehicleId.value = ''
    return
  }

  const assignmentMap = new Map((assignments || []).map((assignment) => [assignment.vehicle_id, assignment.assigned_driver_id || null]))
  const driverNameMap = new Map((drivers || []).map((driver: any) => [driver.id, `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Assigned driver']))

  availableVehicles.value = ((data || []) as VehicleSummary[]).map((vehicle) => ({
    ...vehicle,
    assigned_driver_id: assignmentMap.get(vehicle.id) || null,
    assigned_driver_name: assignmentMap.get(vehicle.id) ? (driverNameMap.get(assignmentMap.get(vehicle.id) as string) || null) : null,
  }))
  selectedVehicleId.value = availableVehicles.value[0]?.id || ''
  syncVehicleTelemetry()
}

function setState(item: Item, s: State) {
  item.state = item.state === s ? null : s
}

function addPhoto(item: Item) {
  const url = photoUrls[item.photos.length % photoUrls.length]
  if (!item.photos.includes(url)) item.photos.push(url)
}

function markAllPass() {
  items.value.forEach(i => { i.state = 'pass' })
}

const allPass  = computed(() => items.value.length > 0 && items.value.every(i => i.state === 'pass'))
const doneCount = computed(() => items.value.filter(i => i.state !== null).length)
const passCount = computed(() => items.value.filter(i => i.state === 'pass').length)
const failCount = computed(() => items.value.filter(i => i.state === 'fail').length)
const progress  = computed(() => items.value.length ? Math.round((doneCount.value / items.value.length) * 100) : 0)

async function handleSubmit() {
  submitError.value = ''

  if (!selectedVehicle.value) {
    submitError.value = 'Select a vehicle from the fleet before submitting the inspection.'
    return
  }

  if (currentOdometer.value === null || Number.isNaN(Number(currentOdometer.value))) {
    submitError.value = 'Enter the current odometer reading before submitting.'
    return
  }

  if (selectedVehicle.value.odometer != null && Number(currentOdometer.value) < Number(selectedVehicle.value.odometer)) {
    submitError.value = `Current odometer cannot be less than the last recorded value of ${Number(selectedVehicle.value.odometer).toLocaleString()} ${activeDistanceUnit.value}.`
    return
  }

  if (currentEngineHours.value !== null && selectedVehicle.value.engine_hours != null && Number(currentEngineHours.value) < Number(selectedVehicle.value.engine_hours)) {
    submitError.value = `Current engine hours cannot be less than the last recorded value of ${Number(selectedVehicle.value.engine_hours).toLocaleString()} hrs.`
    return
  }

  const missingChecks = items.value.filter((item) => item.required && item.state === null)
  if (missingChecks.length > 0) {
    submitError.value = 'Complete all required checklist items before submitting.'
    return
  }

  const missingPhotos = items.value.filter((item) => item.photoRequired && item.state !== null && item.photos.length === 0)
  if (missingPhotos.length > 0) {
    submitError.value = 'Add photos to every checklist item that requires photo evidence.'
    return
  }

  if (authStore.user?.id && authStore.companyId) {
    try {
      const { data: driverRecord } = await supabase
        .from('drivers')
        .select('id')
        .eq('auth_user_id', authStore.user.id)
        .maybeSingle()

      const inspectionDriverId = driverRecord?.id || selectedVehicle.value.assigned_driver_id || null
      const performerRole = authStore.currentCompany?.role || authStore.profile?.role || 'user'
      const performerName = driverDisplayName.value

      const notes = items
        .value
        .filter((item) => item.state === 'fail' && item.note.trim())
        .map((item) => `${item.section}: ${item.label} - ${item.note.trim()}`)
        .join('\n')

      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({
          odometer: Number(currentOdometer.value),
          engine_hours: currentEngineHours.value !== null ? Number(currentEngineHours.value) : null,
        })
        .eq('id', selectedVehicle.value.id)

      if (vehicleUpdateError) {
        throw vehicleUpdateError
      }

      await supabase
        .from('inspections')
        .insert({
          company_id: authStore.companyId,
          driver_id: inspectionDriverId,
          vehicle_id: selectedVehicle.value.id,
          performed_by_user_id: authStore.user.id,
          inspection_type: props.isPostTrip ? 'post-trip' : 'pre-trip',
          result: failCount.value > 0 ? 'fail' : 'pass',
          notes: notes || null,
          vehicle_odometer: Number(currentOdometer.value),
          vehicle_engine_hours: currentEngineHours.value !== null ? Number(currentEngineHours.value) : null,
          distance_unit: activeDistanceUnit.value,
          dimension_unit: activeDimensionUnit.value,
          responses: items.value.map((item) => ({
            id: item.id,
            section: item.section,
            label: item.label,
            state: item.state,
            note: item.note || null,
            photos: item.photos,
            required: item.required,
            photo_required: item.photoRequired,
          })),
        })
    } catch (error) {
      console.error('Unable to save inspection record.', error)
      submitError.value = error instanceof Error ? error.message : 'Unable to save inspection record.'
      return
    }
  }

  store.setInspectionContext({
    vehicle: `${selectedVehicle.value.make} ${selectedVehicle.value.model} · #${selectedVehicle.value.unit}`,
    driver: selectedVehicle.value.assigned_driver_name || driverDisplayName.value,
    performedBy: `${performerName} (${performerRole})`,
    type: props.isPostTrip ? 'Post-Trip Inspection' : 'Pre-Trip Inspection',
    time: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date()),
    photosTaken: items.value.reduce((total, item) => total + item.photos.length, 0),
    passedCount: items.value.filter((item) => item.state === 'pass').length,
    failedCount: failCount.value,
    naCount: items.value.filter((item) => item.state === null).length,
    duration: `${Math.max(1, Math.round(items.value.length / 3))} minutes`,
  })
  store.setInspectionResult(failCount.value > 0 ? 'fail' : 'pass')
  router.push('/inspect/result')
}

onMounted(async () => {
  await loadVehicles()
  await loadInspectionTemplates()
})

watch(() => authStore.companyId, async () => {
  await loadVehicles()
  await loadInspectionTemplates()
})
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
