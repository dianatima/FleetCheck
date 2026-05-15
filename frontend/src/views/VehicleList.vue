<template>
  <AppLayout title="Fleet Vehicles">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchVehicles')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="active">{{ store.t('statusActive') }}</option>
          <option value="needs-attention">{{ store.t('statusNeedsAttention') }}</option>
          <option value="blocked">{{ store.t('statusBlocked') }}</option>
          <option value="in-repair">{{ store.t('statusInRepair') }}</option>
        </select>
      </div>
      <button @click="showModal = true" class="btn-primary gap-2 text-sm"><Plus :size="16" /> {{ store.t('addVehicle') }}</button>
    </div>

    <!-- Summary badges -->
    <div class="flex flex-wrap gap-2 mb-5">
      <span class="badge-green">{{ vehicles.filter(v => v.status === 'active').length }} {{ store.t('statusActive') }}</span>
      <span class="badge-orange">{{ vehicles.filter(v => v.status === 'needs-attention').length }} {{ store.t('statusNeedsAttention') }}</span>
      <span class="badge-red">{{ vehicles.filter(v => v.status === 'blocked').length }} {{ store.t('statusBlocked') }}</span>
      <span class="badge-gray">{{ vehicles.filter(v => v.status === 'in-repair').length }} {{ store.t('statusInRepair') }}</span>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in vehicleHeaders" :key="h" class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in filtered" :key="v.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-3 cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img v-if="v.photo" :src="v.photo" alt="" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ v.name }}</p>
                    <p class="text-xs font-mono text-gray-400">{{ v.unit }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">{{ v.type }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">{{ v.year ?? '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">{{ v.plate }}</td>
              <td class="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">{{ v.vin !== 'N/A' ? v.vin.substring(0, 12) + '…' : '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">{{ v.odometer != null ? v.odometer.toLocaleString() + ' mi' : '—' }}</td>
              <td class="px-4 py-3 cursor-pointer" @click="router.push(`/vehicles/${v.id}`)"><span :class="statusConfig[v.status].badge">{{ statusConfig[v.status].label }}</span></td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button @click.stop="startEdit(v)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <Pencil :size="14" />
                  </button>
                  <button @click.stop="confirmDelete(v)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Vehicle Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editingId ? store.t('editVehicle') : store.t('addVehicle') }}</h2>
              <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X :size="18" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSave" class="p-6 space-y-5">
              <!-- Photo upload -->
              <div>
                <label class="label">{{ store.t('vehiclePhoto') }}</label>
                <div
                  class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors relative group"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="handleDrop"
                >
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
                  <template v-if="photoPreview">
                    <img :src="photoPreview" alt="Preview" class="w-full max-h-40 object-cover rounded-lg" />
                    <button type="button" @click.stop="photoPreview = null; form.photo = ''" class="text-xs text-red-500 hover:underline">{{ store.t('removePhoto') }}</button>
                  </template>
                  <template v-else>
                    <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Camera :size="22" class="text-blue-500" />
                    </div>
                    <div class="text-center">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ store.t('clickToUpload') }}</p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ store.t('pngJpgUpTo10mb') }}</p>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Row 1: Vehicle Number + Type -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('vehicleNumber') }} <span class="text-red-500">*</span></label>
                  <input v-model="form.unit" class="input-field" placeholder="FR-001" required />
                </div>
                <div>
                  <label class="label">{{ store.t('type') }} <span class="text-red-500">*</span></label>
                  <select v-model="form.type" class="input-field" required>
                    <option value="" disabled>{{ store.t('selectType') }}</option>
                    <option v-for="t in vehicleTypes" :key="t">{{ t }}</option>
                  </select>
                </div>
              </div>

              <!-- Row 2: Make + Model -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('make') }} <span class="text-red-500">*</span></label>
                  <input v-model="form.make" class="input-field" placeholder="Toyota" required />
                </div>
                <div>
                  <label class="label">{{ store.t('model') }} <span class="text-red-500">*</span></label>
                  <input v-model="form.model" class="input-field" placeholder="Camry" required />
                </div>
              </div>

              <!-- Row 3: Year + Plate Number -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('year') }} <span class="text-red-500">*</span></label>
                  <input v-model="form.year" class="input-field" type="number" placeholder="2023" min="1990" :max="new Date().getFullYear() + 1" required />
                </div>
                <div>
                  <label class="label">{{ store.t('plateNumber') }} <span class="text-red-500">*</span></label>
                  <input v-model="form.plate" class="input-field" placeholder="IL-1234-AB" required />
                </div>
              </div>

              <!-- Row 4: VIN + Odometer -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('vin') }}</label>
                  <input v-model="form.vin" class="input-field" placeholder="1HGBH41JXMN109186" />
                </div>
                <div>
                  <label class="label">{{ store.t('odometer') }}</label>
                  <input v-model="form.odometer" class="input-field" type="number" placeholder="0" min="0" />
                </div>
              </div>

              <!-- Row 5: Status -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('status') }} <span class="text-red-500">*</span></label>
                  <select v-model="form.status" class="input-field" required>
                    <option v-for="s in vehicleStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" @click="closeModal" class="btn-secondary px-5 py-2.5">{{ store.t('cancel') }}</button>
                <button type="submit" class="btn-primary px-6 py-2.5 gap-2">
                  <Save :size="16" /> {{ store.t('save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Plus, X, Camera, Save, Pencil, Trash2 } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const search = ref('')
const filterStatus = ref('all')
const showModal = ref(false)
const editingId = ref<number | null>(null)
const deleteTarget = ref<number | null>(null)
const photoPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const vehicleTypes = ['Truck', 'Van', 'Car', 'Equipment', 'Bus', 'Trailer', 'Pickup', 'Other']
const vehicleStatuses = computed(() => [
  { value: 'active', label: store.t('statusActive') },
  { value: 'needs-attention', label: store.t('statusNeedsAttention') },
  { value: 'blocked', label: store.t('statusBlocked') },
  { value: 'in-repair', label: store.t('statusInRepair') },
])

const defaultForm = () => ({
  unit: '',
  type: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plate: '',
  vin: '',
  odometer: 0,
  status: 'active',
  photo: '',
})

const form = ref(defaultForm())

function closeModal() {
  showModal.value = false
  editingId.value = null
  form.value = defaultForm()
  photoPreview.value = null
}

function startEdit(v: typeof vehicles.value[0]) {
  const [make, ...rest] = v.name.split(' ')
  form.value = {
    unit: v.unit.replace('#', ''),
    type: v.type,
    make,
    model: rest.join(' '),
    year: v.year ?? new Date().getFullYear(),
    plate: v.plate,
    vin: v.vin === 'N/A' ? '' : v.vin,
    odometer: v.odometer ?? 0,
    status: v.status,
    photo: v.photo,
  }
  photoPreview.value = v.photo || null
  editingId.value = v.id
  showModal.value = true
}

function confirmDelete(v: typeof vehicles.value[0]) {
  if (confirm(`Delete "${v.name}" (${v.unit})?`)) {
    vehicles.value = vehicles.value.filter(x => x.id !== v.id)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    photoPreview.value = ev.target?.result as string
    form.value.photo = photoPreview.value
  }
  reader.readAsDataURL(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    photoPreview.value = ev.target?.result as string
    form.value.photo = photoPreview.value
  }
  reader.readAsDataURL(file)
}

let nextId = 100

function handleSave() {
  if (editingId.value !== null) {
    const idx = vehicles.value.findIndex(v => v.id === editingId.value)
    if (idx !== -1) {
      vehicles.value[idx] = {
        ...vehicles.value[idx],
        unit: `#${form.value.unit}`,
        name: `${form.value.make} ${form.value.model}`,
        plate: form.value.plate,
        vin: form.value.vin || 'N/A',
        type: form.value.type,
        year: form.value.year,
        odometer: form.value.odometer,
        status: form.value.status,
        photo: form.value.photo || '',
      }
    }
  } else {
    vehicles.value.push({
      id: ++nextId,
      unit: `#${form.value.unit}`,
      name: `${form.value.make} ${form.value.model}`,
      plate: form.value.plate,
      vin: form.value.vin || 'N/A',
      type: form.value.type,
      year: form.value.year,
      odometer: form.value.odometer,
      status: form.value.status,
      photo: form.value.photo || '',
    })
  }
  closeModal()
}

const vehicles = ref([
  { id: 1, unit: '#1042', name: 'Kenworth T680', plate: 'ABC-1234', vin: '1XKAD49X1EJ301042', type: 'Truck', year: 2022, odometer: 84200, status: 'active', photo: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=200' },
  { id: 2, unit: '#0781', name: 'Peterbilt 579', plate: 'XYZ-5678', vin: '1XPWD49X2EN781234', type: 'Truck', year: 2021, odometer: 123500, status: 'needs-attention', photo: 'https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=200' },
  { id: 3, unit: '#2210', name: 'Freightliner Cascadia', plate: 'DEF-9012', vin: '3AKJGLD57ESDC2210', type: 'Truck', year: 2023, odometer: 47800, status: 'active', photo: 'https://images.pexels.com/photos/5025642/pexels-photo-5025642.jpeg?w=200' },
  { id: 4, unit: '#0521', name: 'Volvo VNL 860', plate: 'GHI-3456', vin: '4V4NC9EH4EN521096', type: 'Truck', year: 2020, odometer: 198000, status: 'blocked', photo: 'https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=200' },
  { id: 5, unit: '#3305', name: 'Ford F-350', plate: 'JKL-7890', vin: '1FT8W3BT5NEC33050', type: 'Pickup', year: 2024, odometer: 12300, status: 'active', photo: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=200' },
  { id: 6, unit: '#1099', name: 'Genie S-65 Boom Lift', plate: 'N/A', vin: 'GS65A109900199', type: 'Equipment', year: 2019, odometer: 0, status: 'in-repair', photo: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?w=200' },
])

const statusConfig = computed((): Record<string, { label: string; badge: string }> => ({
  active: { label: store.t('statusActive'), badge: 'badge-green' },
  'needs-attention': { label: store.t('statusNeedsAttention'), badge: 'badge-orange' },
  blocked: { label: store.t('statusBlocked'), badge: 'badge-red' },
  'in-repair': { label: store.t('statusInRepair'), badge: 'badge-gray' },
}))

const vehicleHeaders = computed(() => [store.t('vehicle'), store.t('type'), store.t('year'), store.t('plate'), store.t('vin'), store.t('odometer'), store.t('status'), ''])

const filtered = computed(() => vehicles.value.filter(v => {
  const matchSearch = v.name.toLowerCase().includes(search.value.toLowerCase()) || v.unit.includes(search.value) || v.plate.toLowerCase().includes(search.value.toLowerCase())
  const matchStatus = filterStatus.value === 'all' || v.status === filterStatus.value
  return matchSearch && matchStatus
}))
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .relative, .modal-leave-active .relative { transition: transform 0.2s ease; }
.modal-enter-from .relative { transform: scale(0.96) translateY(8px); }
.modal-leave-to .relative { transform: scale(0.96) translateY(8px); }
</style>
