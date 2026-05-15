<template>
  <AppLayout title="Vehicle Detail">
    <RouterLink to="/vehicles" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('backToFleet') }}
    </RouterLink>

    <div class="card overflow-hidden mb-5">
      <div class="h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        <img :src="vehicle.photo" :alt="vehicle.name" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h2 class="text-xl font-bold text-white">{{ vehicle.name }}</h2>
            <p class="text-white/80 text-sm">Unit {{ vehicle.unit }} · {{ vehicle.year }}</p>
          </div>
          <span :class="statusConfig[vehicle.status].badge">{{ statusConfig[vehicle.status].label }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700">
        <button @click="openEdit" class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center"><Edit :size="15" /> {{ store.t('editVehicle') }}</button>
        <RouterLink to="/reports" class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center inline-flex"><FileText :size="15" /> {{ store.t('reports') }}</RouterLink>
        <button @click="toggleOutOfService" class="gap-2 text-sm flex-1 sm:flex-none justify-center btn-danger">
          <XCircle :size="15" /> {{ vehicle.status === 'blocked' ? store.t('restoreService') : store.t('outOfService') }}
        </button>
      </div>

      <!-- Details grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="(item, i) in details" :key="item.label"
          class="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-700"
          :class="i % 3 !== 2 ? 'lg:border-r' : ''">
          <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <component :is="item.icon" :size="15" class="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.label }}</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Photos -->
    <div class="card p-5 mb-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('vehiclePhotos') }}</h3>
        <button class="btn-secondary gap-1.5 text-xs py-1.5"><Camera :size="13" /> {{ store.t('addPhoto') }}</button>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <div v-for="(src, i) in photos" :key="i" class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity">
          <img :src="src" alt="" class="w-full h-full object-cover" />
        </div>
        <div class="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <Camera :size="18" class="text-gray-400 mb-1" />
          <span class="text-[10px] text-gray-400">Add</span>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-5">
      <div class="card">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('inspectionHistory') }}</h3>
          <RouterLink to="/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
        </div>
        <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <div v-for="h in inspHistory" :key="h.date" class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div class="w-2 h-2 rounded-full flex-shrink-0" :class="h.status === 'pass' ? 'bg-green-500' : 'bg-red-500'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ h.type }}</p>
              <p class="text-xs text-gray-400">{{ h.date }} · {{ h.driver }}</p>
            </div>
            <span v-if="h.issues > 0" class="badge-red">{{ h.issues }} issues</span>
            <span :class="h.status === 'pass' ? 'badge-green' : 'badge-red'">{{ h.status === 'pass' ? store.t('pass') : store.t('fail') }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('repairHistory') }}</h3>
          <RouterLink to="/repairs" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
        </div>
        <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <div v-for="r in repairHistory" :key="r.issue" class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ r.issue }}</p>
              <p class="text-xs text-gray-400">{{ r.date }}</p>
            </div>
            <span :class="r.priority === 'high' ? 'badge-red' : r.priority === 'medium' ? 'badge-orange' : 'badge-gray'">{{ r.priority }}</span>
            <span class="badge-green">{{ store.t('statusCompleted') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showEditModal = false" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ store.t('editVehicle') }}</h2>
              <button @click="showEditModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X :size="18" />
              </button>
            </div>
            <form @submit.prevent="saveEdit" class="p-6 space-y-5">
              <div>
                <label class="label">{{ store.t('vehiclePhoto') }}</label>
                <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors" @click="editFileInput?.click()">
                  <input ref="editFileInput" type="file" accept="image/*" class="hidden" @change="handleEditPhoto" />
                  <template v-if="editForm.photo">
                    <img :src="editForm.photo" alt="Preview" class="w-full max-h-40 object-cover rounded-lg" />
                    <button type="button" @click.stop="editForm.photo = ''" class="text-xs text-red-500 hover:underline">{{ store.t('removePhoto') }}</button>
                  </template>
                  <template v-else>
                    <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><Camera :size="22" class="text-blue-500" /></div>
                    <div class="text-center"><p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ store.t('clickToUpload') }}</p><p class="text-xs text-gray-400 mt-0.5">{{ store.t('pngJpgUpTo10mb') }}</p></div>
                  </template>
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div><label class="label">{{ store.t('vehicleNumber') }} <span class="text-red-500">*</span></label><input v-model="editForm.unit" class="input-field" required /></div>
                <div><label class="label">{{ store.t('type') }} <span class="text-red-500">*</span></label><select v-model="editForm.type" class="input-field" required><option v-for="t in vehicleTypes" :key="t">{{ t }}</option></select></div>
                <div><label class="label">{{ store.t('make') }} <span class="text-red-500">*</span></label><input v-model="editForm.make" class="input-field" required /></div>
                <div><label class="label">{{ store.t('model') }} <span class="text-red-500">*</span></label><input v-model="editForm.model" class="input-field" required /></div>
                <div><label class="label">{{ store.t('year') }} <span class="text-red-500">*</span></label><input v-model="editForm.year" class="input-field" type="number" min="1990" :max="new Date().getFullYear()+1" required /></div>
                <div><label class="label">{{ store.t('plateNumber') }} <span class="text-red-500">*</span></label><input v-model="editForm.plate" class="input-field" required /></div>
                <div><label class="label">{{ store.t('vin') }}</label><input v-model="editForm.vin" class="input-field" /></div>
                <div><label class="label">{{ store.t('odometer') }}</label><input v-model="editForm.odometer" class="input-field" type="number" min="0" /></div>
                <div><label class="label">{{ store.t('engineHours') }}</label><input v-model="editForm.engineHours" class="input-field" type="number" min="0" /></div>
                <div><label class="label">{{ store.t('status') }} <span class="text-red-500">*</span></label><select v-model="editForm.status" class="input-field" required><option v-for="s in vehicleStatuses" :key="s.value" :value="s.value">{{ s.label }}</option></select></div>
              </div>
              <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" @click="showEditModal = false" class="btn-secondary px-5 py-2.5">{{ store.t('cancel') }}</button>
                <button type="submit" class="btn-primary px-6 py-2.5 gap-2"><Save :size="16" /> {{ store.t('saveChanges') }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ArrowLeft, CreditCard as Edit, FileText, XCircle, Camera, Fuel, Gauge, Calendar, Hash, ChevronRight, MapPin, X, Save } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
const store = useAppStore()

const vehicleTypes = ['Truck', 'Van', 'Car', 'Equipment', 'Bus', 'Trailer', 'Pickup', 'Other']
const vehicleStatuses = computed(() => [
  { value: 'active', label: store.t('statusActive') },
  { value: 'needs-attention', label: store.t('statusNeedsAttention') },
  { value: 'blocked', label: store.t('statusBlocked') },
  { value: 'in-repair', label: store.t('statusInRepair') },
])
const statusConfig = computed((): Record<string, { label: string; badge: string }> => ({
  active: { label: store.t('statusActive'), badge: 'badge-green' },
  'needs-attention': { label: store.t('statusNeedsAttention'), badge: 'badge-orange' },
  blocked: { label: store.t('statusBlocked'), badge: 'badge-red' },
  'in-repair': { label: store.t('statusInRepair'), badge: 'badge-gray' },
}))

const vehicle = reactive({
  name: 'Kenworth T680', unit: '#1042', year: 2022, plate: 'ABC-1234',
  vin: '1XKAD49X1EJ301042', type: 'Truck', odometer: 125847, engineHours: 3214,
  status: 'active', photo: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=800',
})

const details = computed(() => [
  { icon: Hash,     label: store.t('vin'),           value: vehicle.vin },
  { icon: MapPin,   label: store.t('plateNumber'),    value: vehicle.plate },
  { icon: Calendar, label: store.t('year'),           value: String(vehicle.year) },
  { icon: Gauge,    label: store.t('odometer'),       value: `${vehicle.odometer.toLocaleString()} mi` },
  { icon: Fuel,     label: store.t('engineHours'),    value: `${vehicle.engineHours.toLocaleString()} hrs` },
  { icon: Hash,     label: store.t('type'),           value: vehicle.type },
])

const photos = [
  'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=150',
  'https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=150',
  'https://images.pexels.com/photos/5025642/pexels-photo-5025642.jpeg?w=150',
  'https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=150',
]

const inspHistory = [
  { date: 'Today 7:24 AM',     type: 'Pre-Trip',  driver: 'John Smith', status: 'pass', issues: 0 },
  { date: 'Yesterday 6:15 PM', type: 'Post-Trip', driver: 'John Smith', status: 'pass', issues: 0 },
  { date: 'May 11, 7:02 AM',   type: 'Pre-Trip',  driver: 'John Smith', status: 'fail', issues: 2 },
  { date: 'May 10, 6:45 PM',   type: 'Post-Trip', driver: 'John Smith', status: 'pass', issues: 0 },
]

const repairHistory = [
  { date: 'May 8',  issue: 'Left rear tire pressure',      priority: 'medium' },
  { date: 'Apr 28', issue: 'Windshield wiper replacement', priority: 'low' },
  { date: 'Apr 10', issue: 'Brake pad inspection',         priority: 'high' },
]

const showEditModal = ref(false)
const editFileInput = ref<HTMLInputElement | null>(null)
const editForm = reactive({ unit: '', type: '', make: '', model: '', year: 2022, plate: '', vin: '', odometer: 0, engineHours: 0, status: 'active', photo: '' })

function openEdit() {
  const [make, ...rest] = vehicle.name.split(' ')
  Object.assign(editForm, { unit: vehicle.unit.replace('#', ''), type: vehicle.type, make, model: rest.join(' '), year: vehicle.year, plate: vehicle.plate, vin: vehicle.vin, odometer: vehicle.odometer, engineHours: vehicle.engineHours, status: vehicle.status, photo: vehicle.photo })
  showEditModal.value = true
}

function handleEditPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { editForm.photo = ev.target?.result as string }
  reader.readAsDataURL(file)
}

function saveEdit() {
  vehicle.name = `${editForm.make} ${editForm.model}`
  vehicle.unit = `#${editForm.unit}`
  vehicle.type = editForm.type
  vehicle.year = Number(editForm.year)
  vehicle.plate = editForm.plate
  vehicle.vin = editForm.vin
  vehicle.odometer = Number(editForm.odometer)
  vehicle.engineHours = Number(editForm.engineHours)
  vehicle.status = editForm.status
  vehicle.photo = editForm.photo
  showEditModal.value = false
}

function toggleOutOfService() {
  vehicle.status = vehicle.status === 'blocked' ? 'active' : 'blocked'
}
</script>

<style scoped>
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.btn-danger   { @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
