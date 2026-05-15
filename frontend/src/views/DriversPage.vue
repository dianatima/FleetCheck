<template>
  <AppLayout title="Drivers">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchDrivers')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="active">{{ store.t('statusActive') }}</option>
          <option value="pending">{{ store.t('statusPending') }}</option>
          <option value="inactive">{{ store.t('statusInactive') }}</option>
        </select>
      </div>
      <button @click="openAddModal" class="btn-primary gap-2 text-sm"><Plus :size="16" /> {{ store.t('addDriver') }}</button>
    </div>

    <!-- Summary badges -->
    <div class="flex flex-wrap gap-2 mb-5">
      <span class="badge-green">{{ drivers.filter(d => d.status === 'active').length }} {{ store.t('statusActive') }}</span>
      <span class="badge-yellow">{{ drivers.filter(d => d.status === 'pending').length }} {{ store.t('statusPending') }}</span>
      <span class="badge-gray">{{ drivers.filter(d => d.status === 'inactive').length }} {{ store.t('statusInactive') }}</span>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">{{ store.t('driver') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('phone') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('licenseHash') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('licExpiry') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('medExpiry') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ store.t('allowedVehicles') }}</th>
              <th class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3">{{ store.t('status') }}</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="8" class="text-center py-12 text-sm text-gray-400">{{ store.t('noDriversFound') }}</td>
            </tr>
            <tr
              v-for="d in filtered"
              :key="d.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              @click="openCard(d)"
            >
              <!-- Driver name -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" :style="{ background: d.avatarColor }">
                    {{ initials(d.name) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ d.name }}</p>
                    <p class="text-xs text-gray-400">{{ d.email }}</p>
                  </div>
                </div>
              </td>
              <!-- Phone -->
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ d.phone }}</td>
              <!-- License # -->
              <td class="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ d.licenseNo }}</td>
              <!-- License expiry — red if expired -->
              <td class="px-4 py-3 text-sm whitespace-nowrap font-medium" :class="isExpired(d.licenseExpiry) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
                <div class="flex items-center gap-1">
                  <AlertCircle v-if="isExpired(d.licenseExpiry)" :size="13" class="flex-shrink-0" />
                  {{ d.licenseExpiry ? formatDate(d.licenseExpiry) : '—' }}
                </div>
              </td>
              <!-- Med card expiry — red if expired -->
              <td class="px-4 py-3 text-sm whitespace-nowrap font-medium" :class="isExpired(d.medCardExpiry) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
                <div class="flex items-center gap-1">
                  <AlertCircle v-if="isExpired(d.medCardExpiry)" :size="13" class="flex-shrink-0" />
                  {{ d.medCardExpiry ? formatDate(d.medCardExpiry) : '—' }}
                </div>
              </td>
              <!-- Allowed vehicles -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-for="t in d.allowedVehicles" :key="t" class="badge-blue text-[10px]">{{ t }}</span>
                  <span v-if="!d.allowedVehicles.length" class="text-xs text-gray-400">—</span>
                </div>
              </td>
              <!-- Status -->
              <td class="px-4 py-3"><span :class="statusConfig[d.status].badge">{{ statusConfig[d.status].label }}</span></td>
              <!-- Actions — stop propagation so row click doesn't also trigger -->
              <td class="px-4 py-3" @click.stop>
                <div class="flex items-center gap-1">
                  <button @click="startEdit(d)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <Pencil :size="14" />
                  </button>
                  <button @click="confirmDelete(d)" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── Add/Edit Driver Modal ─── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editingId ? store.t('editDriver') : store.t('addDriver') }}</h2>
              <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X :size="18" />
              </button>
            </div>

            <form @submit.prevent="handleSave" class="p-6 space-y-6">
              <!-- Personal Info -->
              <section>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <User :size="15" class="text-blue-500" /> {{ store.t('personalInformation') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('firstName') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.firstName" class="input-field" placeholder="John" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('lastName') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.lastName" class="input-field" placeholder="Smith" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('emailField') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.email" class="input-field" type="email" placeholder="john@company.com" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('phone') }}</label>
                    <input v-model="form.phone" class="input-field" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('dateOfBirth') }}</label>
                    <input v-model="form.birthday" class="input-field" type="date" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('temporaryPassword') }} <span v-if="!editingId" class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="form.tempPassword" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" :required="!editingId" />
                      <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <EyeOff v-if="showPass" :size="15" /><Eye v-else :size="15" />
                      </button>
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('homeAddress') }}</label>
                  <div class="relative">
                    <MapPin :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="form.address" class="input-field pl-9" placeholder="123 Main St, City, State" />
                  </div>
                </div>
              </section>

              <!-- Emergency Contact -->
              <section class="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/40 dark:bg-red-900/10">
                <h3 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <Heart :size="15" /> {{ store.t('emergencyContact') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('contactName') }}</label>
                    <input v-model="form.emergencyName" class="input-field" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('contactPhone') }}</label>
                    <input v-model="form.emergencyPhone" class="input-field" placeholder="+1 555-9999" />
                  </div>
                </div>
              </section>

              <!-- Driver License -->
              <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <FileText :size="15" class="text-blue-500" /> {{ store.t('driverLicense') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('licenseNumber') }} <span class="text-red-500">*</span></label>
                    <input v-model="form.licenseNo" class="input-field" placeholder="DL-123456" required />
                  </div>
                  <div>
                    <label class="label">{{ store.t('licenseClass') }} <span class="text-red-500">*</span></label>
                    <select v-model="form.licenseClass" class="input-field" required>
                      <option value="">{{ store.t('selectClass') }}</option>
                      <option v-for="c in licenseClasses" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="label">{{ store.t('expiryDate') }}</label>
                    <input v-model="form.licenseExpiry" class="input-field" type="date" />
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('licensePhoto') }}</label>
                  <PhotoUpload label="License Photo" />
                </div>
              </section>

              <!-- Medical Card -->
              <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <FileText :size="15" class="text-green-500" /> {{ store.t('medicalCard') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('medicalCardNumber') }}</label>
                    <input v-model="form.medCardNo" class="input-field" placeholder="MC-123456" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('expiryDate') }}</label>
                    <input v-model="form.medCardExpiry" class="input-field" type="date" />
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('medicalCardPhoto') }}</label>
                  <PhotoUpload label="Medical Card Photo" />
                </div>
              </section>

              <!-- Employment -->
              <section>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Briefcase :size="15" class="text-blue-500" /> {{ store.t('employment') }}
                </h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="label">{{ store.t('hireDate') }}</label>
                    <input v-model="form.hireDate" class="input-field" type="date" />
                  </div>
                  <div>
                    <label class="label">{{ store.t('status') }} <span class="text-red-500">*</span></label>
                    <select v-model="form.status" class="input-field" required>
                      <option v-for="s in driverStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                    </select>
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('allowedVehicleTypes') }}</label>
                  <div class="flex flex-wrap gap-2 mt-1">
                    <button
                      v-for="t in vehicleTypes"
                      :key="t"
                      type="button"
                      @click="toggleVehicleType(t)"
                      class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      :class="form.allowedVehicles.includes(t)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'"
                    >{{ t }}</button>
                  </div>
                </div>
              </section>

              <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" @click="closeModal" class="btn-secondary px-5 py-2.5">{{ store.t('cancel') }}</button>
                <button type="submit" class="btn-primary px-6 py-2.5 gap-2"><Save :size="16" /> {{ store.t('saveDriver') }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Plus, X, Save, Pencil, Trash2, User, MapPin, Heart, FileText, Camera, Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
const store = useAppStore()

const PhotoUpload = defineComponent({
  props: { label: String },
  setup() {
    const dragging = ref(false)
    const file = ref<string | null>(null)
    function onDrop(e: DragEvent) {
      dragging.value = false
      const f = e.dataTransfer?.files[0]
      if (f && f.type.startsWith('image/')) file.value = URL.createObjectURL(f)
    }
    function onPick(e: Event) {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (f) file.value = URL.createObjectURL(f)
    }
    function clear() { file.value = null }
    return () => {
      const inputId = `photo-${Math.random().toString(36).slice(2)}`
      if (file.value) {
        return h('div', { class: 'relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700' }, [
          h('img', { src: file.value, class: 'w-full h-36 object-cover' }),
          h('button', {
            type: 'button', onClick: clear,
            class: 'absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors'
          }, [h(X as any, { size: 14 })]),
        ])
      }
      return h('label', {
        for: inputId,
        class: `flex flex-col items-center justify-center gap-3 py-7 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${dragging.value ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'}`,
        onDragover: (e: DragEvent) => { e.preventDefault(); dragging.value = true },
        onDragleave: () => { dragging.value = false },
        onDrop,
      }, [
        h('div', { class: 'w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center' },
          [h(Camera as any, { size: 26, class: 'text-blue-500' })]),
        h('div', { class: 'text-center' }, [
          h('p', { class: 'text-sm font-semibold text-gray-700 dark:text-gray-300' }, 'Click to upload or drag & drop'),
          h('p', { class: 'text-xs text-gray-400 mt-0.5' }, 'PNG, JPG up to 10 MB'),
        ]),
        h('input', { id: inputId, type: 'file', accept: 'image/*', class: 'sr-only', onChange: onPick }),
      ])
    }
  },
})

const router = useRouter()

// ─── State ───
const search = ref('')
const filterStatus = ref('all')
const showModal = ref(false)
const editingId = ref<number | null>(null)
const showPass = ref(false)

// ─── Config ───
const licenseClasses = ['Class A CDL', 'Class B CDL', 'Class C CDL', 'Class D', 'Class E', 'Motorcycle']
const vehicleTypes = ['Truck', 'Van', 'Car', 'Equipment', 'Bus', 'Trailer', 'Pickup', 'Other']
const driverStatuses = computed(() => [
  { value: 'active',   label: store.t('statusActive') },
  { value: 'pending',  label: store.t('statusPending') },
  { value: 'inactive', label: store.t('statusInactive') },
])
const statusConfig = computed((): Record<string, { label: string; badge: string }> => ({
  'active':   { label: store.t('statusActive'),   badge: 'badge-green' },
  'pending':  { label: store.t('statusPending'),  badge: 'badge-yellow' },
  'inactive': { label: store.t('statusInactive'), badge: 'badge-gray' },
}))
const avatarColors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']

// ─── Helpers ───
const TODAY = new Date().toISOString().split('T')[0]

function isExpired(date: string) {
  return !!date && date < TODAY
}

function formatDate(d: string) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

// ─── Type ───
interface Driver {
  id: number; name: string; email: string; phone: string; birthday: string
  address: string; emergencyName: string; emergencyPhone: string
  licenseNo: string; licenseClass: string; licenseExpiry: string
  medCardNo: string; medCardExpiry: string; hireDate: string
  status: string; allowedVehicles: string[]; avatarColor: string
}

// ─── Card ───
function openCard(d: Driver) { router.push(`/drivers/${d.id}`) }

// ─── Form ───
const defaultForm = () => ({
  firstName: '', lastName: '', email: '', phone: '', birthday: '', tempPassword: '',
  address: '', emergencyName: '', emergencyPhone: '',
  licenseNo: '', licenseClass: '', licenseExpiry: '',
  medCardNo: '', medCardExpiry: '',
  hireDate: '', status: 'active', allowedVehicles: [] as string[],
})
const form = ref(defaultForm())

function toggleVehicleType(t: string) {
  const idx = form.value.allowedVehicles.indexOf(t)
  if (idx === -1) form.value.allowedVehicles.push(t)
  else form.value.allowedVehicles.splice(idx, 1)
}

function openAddModal() {
  form.value = defaultForm()
  editingId.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  form.value = defaultForm()
  showPass.value = false
}

function startEdit(d: Driver) {
  const [firstName, ...rest] = d.name.split(' ')
  form.value = {
    firstName, lastName: rest.join(' '), email: d.email, phone: d.phone,
    birthday: d.birthday, tempPassword: '', address: d.address,
    emergencyName: d.emergencyName, emergencyPhone: d.emergencyPhone,
    licenseNo: d.licenseNo, licenseClass: d.licenseClass, licenseExpiry: d.licenseExpiry,
    medCardNo: d.medCardNo, medCardExpiry: d.medCardExpiry,
    hireDate: d.hireDate, status: d.status, allowedVehicles: [...d.allowedVehicles],
  }
  editingId.value = d.id
  showModal.value = true
}

function confirmDelete(d: Driver) {
  if (confirm(`Delete driver "${d.name}"?`)) {
    drivers.value = drivers.value.filter(x => x.id !== d.id)
  }
}

let nextId = 100

function handleSave() {
  const name = `${form.value.firstName} ${form.value.lastName}`
  const data: Omit<Driver, 'id' | 'avatarColor'> = {
    name, email: form.value.email, phone: form.value.phone, birthday: form.value.birthday,
    address: form.value.address, emergencyName: form.value.emergencyName, emergencyPhone: form.value.emergencyPhone,
    licenseNo: form.value.licenseNo, licenseClass: form.value.licenseClass, licenseExpiry: form.value.licenseExpiry,
    medCardNo: form.value.medCardNo, medCardExpiry: form.value.medCardExpiry,
    hireDate: form.value.hireDate, status: form.value.status, allowedVehicles: [...form.value.allowedVehicles],
  }
  if (editingId.value !== null) {
    const idx = drivers.value.findIndex(d => d.id === editingId.value)
    if (idx !== -1) drivers.value[idx] = { ...drivers.value[idx], ...data }
  } else {
    drivers.value.push({ id: ++nextId, avatarColor: avatarColors[nextId % avatarColors.length], ...data })
  }
  closeModal()
}

// ─── Data ───
const drivers = ref<Driver[]>([
  { id: 1, name: 'John Smith',    email: 'john.smith@fleet.com',   phone: '+1 (555) 012-3456', birthday: '1985-06-15', address: '123 Oak St, Chicago, IL',    emergencyName: 'Mary Smith',    emergencyPhone: '+1 555-9999', licenseNo: 'IL-D123456', licenseClass: 'Class A CDL', licenseExpiry: '2026-08-01', medCardNo: 'MC-001', medCardExpiry: '2025-12-01', hireDate: '2021-03-15', allowedVehicles: ['Truck','Pickup'], status: 'active',   avatarColor: '#3b82f6' },
  { id: 2, name: 'Maria Garcia',  email: 'maria.garcia@fleet.com', phone: '+1 (555) 234-5678', birthday: '1990-02-20', address: '456 Elm Ave, Dallas, TX',     emergencyName: 'Carlos Garcia', emergencyPhone: '+1 555-8888', licenseNo: 'TX-D234567', licenseClass: 'Class A CDL', licenseExpiry: '2027-03-15', medCardNo: 'MC-002', medCardExpiry: '2026-06-01', hireDate: '2020-07-01', allowedVehicles: ['Truck','Van'],    status: 'active',   avatarColor: '#10b981' },
  { id: 3, name: 'David Lee',     email: 'david.lee@fleet.com',    phone: '+1 (555) 345-6789', birthday: '1988-11-03', address: '789 Pine Rd, Miami, FL',      emergencyName: 'Susan Lee',     emergencyPhone: '+1 555-7777', licenseNo: 'FL-D345678', licenseClass: 'Class B CDL', licenseExpiry: '2025-11-20', medCardNo: 'MC-003', medCardExpiry: '2025-09-01', hireDate: '2022-01-10', allowedVehicles: ['Van','Bus'],      status: 'active',   avatarColor: '#f59e0b' },
  { id: 4, name: 'Sarah Johnson', email: 'sarah.j@fleet.com',      phone: '+1 (555) 456-7890', birthday: '1979-04-30', address: '321 Maple Dr, Seattle, WA',  emergencyName: 'Tom Johnson',   emergencyPhone: '+1 555-6666', licenseNo: 'WA-D456789', licenseClass: 'Class A CDL', licenseExpiry: '2026-01-10', medCardNo: 'MC-004', medCardExpiry: '2026-01-01', hireDate: '2019-11-20', allowedVehicles: ['Truck'],          status: 'pending',  avatarColor: '#ef4444' },
  { id: 5, name: 'Mike Brown',    email: 'mike.brown@fleet.com',   phone: '+1 (555) 567-8901', birthday: '1995-09-12', address: '654 Cedar Ln, Phoenix, AZ',  emergencyName: 'Lisa Brown',    emergencyPhone: '+1 555-5555', licenseNo: 'AZ-D567890', licenseClass: 'Class B CDL', licenseExpiry: '2027-05-01', medCardNo: 'MC-005', medCardExpiry: '2027-02-01', hireDate: '2023-05-08', allowedVehicles: ['Pickup','Car'],   status: 'pending',  avatarColor: '#06b6d4' },
  { id: 6, name: 'Anna White',    email: 'anna.white@fleet.com',   phone: '+1 (555) 678-9012', birthday: '1983-07-22', address: '987 Birch St, Boston, MA',   emergencyName: 'Paul White',    emergencyPhone: '+1 555-4444', licenseNo: 'MA-D678901', licenseClass: 'Class A CDL', licenseExpiry: '2024-12-01', medCardNo: 'MC-006', medCardExpiry: '2024-10-01', hireDate: '2018-09-03', allowedVehicles: [],                 status: 'inactive', avatarColor: '#ec4899' },
])

const filtered = computed(() => drivers.value.filter(d => {
  const q = search.value.toLowerCase()
  const matchSearch = d.name.toLowerCase().includes(q) || d.licenseNo.toLowerCase().includes(q) || d.email.toLowerCase().includes(q)
  return matchSearch && (filterStatus.value === 'all' || d.status === filterStatus.value)
}))
</script>

<style scoped>
.badge-blue   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }

/* Modal */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
