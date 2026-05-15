<template>
  <AppLayout title="Driver Profile">
    <RouterLink to="/drivers" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('backToDrivers') }}
    </RouterLink>

    <!-- Header card -->
    <div class="card p-5 mb-5">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md"
             :style="{ background: driver.avatarColor }">
          {{ initials(driver.name) }}
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">{{ driver.name }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ driver.licenseClass }}</p>
          <span :class="statusConfig[driver.status].badge" class="mt-1.5 inline-block">{{ statusConfig[driver.status].label }}</span>
        </div>
        <button @click="showEditModal = true" class="btn-secondary gap-2 text-sm self-start"><Pencil :size="15" /> {{ store.t('edit') }}</button>
      </div>
    </div>

    <!-- Details grid -->
    <div class="grid lg:grid-cols-2 gap-5 mb-5">

      <!-- Personal info -->
      <div class="card p-5 space-y-4">
        <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ store.t('personalInformation') }}</h3>
        <DetailRow :icon="Mail" :label="store.t('emailField')" :value="driver.email" />
        <DetailRow :icon="Phone" :label="store.t('phone')" :value="driver.phone" />
        <DetailRow :icon="Cake" :label="store.t('dateOfBirth')" :value="driver.birthday ? formatDate(driver.birthday) : '—'" />
        <DetailRow :icon="MapPin" :label="store.t('address')" :value="driver.address || '—'" />
        <DetailRow :icon="CalendarDays" :label="store.t('hireDate')" :value="driver.hireDate ? formatDate(driver.hireDate) : '—'" />
      </div>

      <!-- Emergency + vehicle types -->
      <div class="space-y-5">
        <div class="border border-red-200 dark:border-red-800 rounded-xl p-5 bg-red-50/40 dark:bg-red-900/10 space-y-4">
          <h3 class="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5"><Heart :size="12" /> {{ store.t('emergencyContact') }}</h3>
          <DetailRow :icon="User" :label="store.t('contactName')" :value="driver.emergencyName || '—'" />
          <DetailRow :icon="Phone" :label="store.t('phone')" :value="driver.emergencyPhone || '—'" />
        </div>

        <div class="card p-5">
          <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{{ store.t('allowedVehicleTypes') }}</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="t in driver.allowedVehicles" :key="t" class="badge-blue">{{ t }}</span>
            <span v-if="!driver.allowedVehicles.length" class="text-sm text-gray-400">{{ store.t('noneAssigned') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Documents -->
    <div class="grid lg:grid-cols-2 gap-5 mb-5">
      <!-- Driver license -->
      <div class="card p-5 space-y-4">
        <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText :size="12" class="text-blue-500" /> {{ store.t('driverLicense') }}
        </h3>
        <DetailRow :icon="Hash" :label="store.t('licenseNumber')" :value="driver.licenseNo" mono />
        <DetailRow :icon="Award" :label="store.t('class')" :value="driver.licenseClass" />
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays :size="15" class="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('expiryDate') }}</p>
            <p class="text-sm font-semibold flex items-center gap-1.5 mt-0.5"
               :class="isExpired(driver.licenseExpiry) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
              <AlertCircle v-if="isExpired(driver.licenseExpiry)" :size="14" />
              {{ driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '—' }}
              <span v-if="isExpired(driver.licenseExpiry)" class="text-xs font-normal">(Expired)</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Medical card -->
      <div class="card p-5 space-y-4">
        <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText :size="12" class="text-green-500" /> {{ store.t('medicalCard') }}
        </h3>
        <DetailRow :icon="Hash" :label="store.t('cardNumber')" :value="driver.medCardNo || '—'" mono />
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays :size="15" class="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('expiryDate') }}</p>
            <p class="text-sm font-semibold flex items-center gap-1.5 mt-0.5"
               :class="isExpired(driver.medCardExpiry) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'">
              <AlertCircle v-if="isExpired(driver.medCardExpiry)" :size="14" />
              {{ driver.medCardExpiry ? formatDate(driver.medCardExpiry) : '—' }}
              <span v-if="isExpired(driver.medCardExpiry)" class="text-xs font-normal">(Expired)</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent inspections -->
    <div class="card mb-5">
      <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('recentInspections') }}</h3>
        <RouterLink to="/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">{{ store.t('viewAll') }} <ChevronRight :size="12" /></RouterLink>
      </div>
      <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
        <div v-for="r in inspections" :key="r.id" class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
          <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="r.status === 'pass' ? 'bg-green-500' : 'bg-red-500'" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ r.type }}</p>
            <p class="text-xs text-gray-400">{{ r.date }}</p>
          </div>
          <span v-if="r.issues > 0" class="badge-red">{{ r.issues }} issues</span>
          <span :class="r.status === 'pass' ? 'badge-green' : 'badge-red'">{{ r.status === 'pass' ? store.t('pass') : store.t('fail') }}</span>
        </div>
      </div>
    </div>

    <!-- Edit modal (same form as DriversPage, embedded) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showEditModal = false" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ store.t('editDriver') }}</h2>
              <button @click="showEditModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X :size="18" />
              </button>
            </div>
            <form @submit.prevent="saveEdit" class="p-6 space-y-6">
              <section>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><User :size="15" class="text-blue-500" /> {{ store.t('personalInformation') }}</h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div><label class="label">{{ store.t('firstName') }} <span class="text-red-500">*</span></label><input v-model="form.firstName" class="input-field" required /></div>
                  <div><label class="label">{{ store.t('lastName') }} <span class="text-red-500">*</span></label><input v-model="form.lastName" class="input-field" required /></div>
                  <div><label class="label">{{ store.t('emailField') }} <span class="text-red-500">*</span></label><input v-model="form.email" class="input-field" type="email" required /></div>
                  <div><label class="label">{{ store.t('phone') }}</label><input v-model="form.phone" class="input-field" /></div>
                  <div><label class="label">{{ store.t('dateOfBirth') }}</label><input v-model="form.birthday" class="input-field" type="date" /></div>
                </div>
                <div class="mt-4">
                  <label class="label">{{ store.t('homeAddress') }}</label>
                  <div class="relative"><MapPin :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="form.address" class="input-field pl-9" /></div>
                </div>
              </section>

              <section class="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/40 dark:bg-red-900/10">
                <h3 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><Heart :size="15" /> {{ store.t('emergencyContact') }}</h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div><label class="label">{{ store.t('contactName') }}</label><input v-model="form.emergencyName" class="input-field" /></div>
                  <div><label class="label">{{ store.t('contactPhone') }}</label><input v-model="form.emergencyPhone" class="input-field" /></div>
                </div>
              </section>

              <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><FileText :size="15" class="text-blue-500" /> {{ store.t('driverLicense') }}</h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div><label class="label">{{ store.t('licenseNumber') }} <span class="text-red-500">*</span></label><input v-model="form.licenseNo" class="input-field" required /></div>
                  <div>
                    <label class="label">{{ store.t('licenseClass') }} <span class="text-red-500">*</span></label>
                    <select v-model="form.licenseClass" class="input-field" required>
                      <option value="">{{ store.t('selectClass') }}</option>
                      <option v-for="c in licenseClasses" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div><label class="label">{{ store.t('expiryDate') }}</label><input v-model="form.licenseExpiry" class="input-field" type="date" /></div>
                </div>
              </section>

              <section class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><FileText :size="15" class="text-green-500" /> {{ store.t('medicalCard') }}</h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div><label class="label">{{ store.t('medicalCardNumber') }}</label><input v-model="form.medCardNo" class="input-field" /></div>
                  <div><label class="label">{{ store.t('expiryDate') }}</label><input v-model="form.medCardExpiry" class="input-field" type="date" /></div>
                </div>
              </section>

              <section>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Briefcase :size="15" class="text-blue-500" /> {{ store.t('employment') }}</h3>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div><label class="label">{{ store.t('hireDate') }}</label><input v-model="form.hireDate" class="input-field" type="date" /></div>
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
                    <button v-for="t in vehicleTypes" :key="t" type="button" @click="toggleVehicleType(t)"
                      class="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      :class="form.allowedVehicles.includes(t) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'">
                      {{ t }}
                    </button>
                  </div>
                </div>
              </section>

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
import { ref, reactive, computed, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft, Pencil, FileText, ChevronRight,
  User, Mail, Phone, MapPin, Heart, Hash, Award, CalendarDays, Cake,
  Briefcase, AlertCircle, X, Save
} from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
const store = useAppStore()

const route = useRoute()

// ─── DetailRow component ───
const DetailRow = defineComponent({
  props: { icon: Object, label: String, value: String, mono: Boolean },
  setup(props) {
    return () => h('div', { class: 'flex items-start gap-3' }, [
      h('div', { class: 'w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0' },
        [h(props.icon as any, { size: 15, class: 'text-gray-500 dark:text-gray-400' })]),
      h('div', [
        h('p', { class: 'text-xs text-gray-500 dark:text-gray-400' }, props.label),
        h('p', { class: `text-sm font-semibold text-gray-900 dark:text-white mt-0.5${props.mono ? ' font-mono' : ''}` }, props.value),
      ]),
    ])
  },
})

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

const TODAY = new Date().toISOString().split('T')[0]
function isExpired(d: string) { return !!d && d < TODAY }
function formatDate(d: string) { if (!d) return '—'; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}` }
function initials(name: string) { return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() }

// ─── Mock data keyed by id ───
const allDrivers: Record<string, any> = {
  '1': { id: 1, name: 'John Smith',    email: 'john.smith@fleet.com',   phone: '+1 (555) 012-3456', birthday: '1985-06-15', address: '123 Oak St, Chicago, IL',    emergencyName: 'Mary Smith',    emergencyPhone: '+1 555-9999', licenseNo: 'IL-D123456', licenseClass: 'Class A CDL', licenseExpiry: '2026-08-01', medCardNo: 'MC-001', medCardExpiry: '2025-12-01', hireDate: '2021-03-15', allowedVehicles: ['Truck','Pickup'], status: 'active',   avatarColor: '#3b82f6' },
  '2': { id: 2, name: 'Maria Garcia',  email: 'maria.garcia@fleet.com', phone: '+1 (555) 234-5678', birthday: '1990-02-20', address: '456 Elm Ave, Dallas, TX',     emergencyName: 'Carlos Garcia', emergencyPhone: '+1 555-8888', licenseNo: 'TX-D234567', licenseClass: 'Class A CDL', licenseExpiry: '2027-03-15', medCardNo: 'MC-002', medCardExpiry: '2026-06-01', hireDate: '2020-07-01', allowedVehicles: ['Truck','Van'],    status: 'active',   avatarColor: '#10b981' },
  '3': { id: 3, name: 'David Lee',     email: 'david.lee@fleet.com',    phone: '+1 (555) 345-6789', birthday: '1988-11-03', address: '789 Pine Rd, Miami, FL',      emergencyName: 'Susan Lee',     emergencyPhone: '+1 555-7777', licenseNo: 'FL-D345678', licenseClass: 'Class B CDL', licenseExpiry: '2025-11-20', medCardNo: 'MC-003', medCardExpiry: '2025-09-01', hireDate: '2022-01-10', allowedVehicles: ['Van','Bus'],      status: 'active',   avatarColor: '#f59e0b' },
  '4': { id: 4, name: 'Sarah Johnson', email: 'sarah.j@fleet.com',      phone: '+1 (555) 456-7890', birthday: '1979-04-30', address: '321 Maple Dr, Seattle, WA',  emergencyName: 'Tom Johnson',   emergencyPhone: '+1 555-6666', licenseNo: 'WA-D456789', licenseClass: 'Class A CDL', licenseExpiry: '2026-01-10', medCardNo: 'MC-004', medCardExpiry: '2026-01-01', hireDate: '2019-11-20', allowedVehicles: ['Truck'],          status: 'pending',  avatarColor: '#ef4444' },
  '5': { id: 5, name: 'Mike Brown',    email: 'mike.brown@fleet.com',   phone: '+1 (555) 567-8901', birthday: '1995-09-12', address: '654 Cedar Ln, Phoenix, AZ',  emergencyName: 'Lisa Brown',    emergencyPhone: '+1 555-5555', licenseNo: 'AZ-D567890', licenseClass: 'Class B CDL', licenseExpiry: '2027-05-01', medCardNo: 'MC-005', medCardExpiry: '2027-02-01', hireDate: '2023-05-08', allowedVehicles: ['Pickup','Car'],   status: 'pending',  avatarColor: '#06b6d4' },
  '6': { id: 6, name: 'Anna White',    email: 'anna.white@fleet.com',   phone: '+1 (555) 678-9012', birthday: '1983-07-22', address: '987 Birch St, Boston, MA',   emergencyName: 'Paul White',    emergencyPhone: '+1 555-4444', licenseNo: 'MA-D678901', licenseClass: 'Class A CDL', licenseExpiry: '2024-12-01', medCardNo: 'MC-006', medCardExpiry: '2024-10-01', hireDate: '2018-09-03', allowedVehicles: [],                 status: 'inactive', avatarColor: '#ec4899' },
}

const driver = reactive({ ...( allDrivers[route.params.id as string] ?? allDrivers['1'] ) })

const inspections = [
  { id: 1, date: 'Today 7:24 AM',      type: 'Pre-Trip',  status: 'pass', issues: 0 },
  { id: 2, date: 'Yesterday 6:15 PM',  type: 'Post-Trip', status: 'pass', issues: 0 },
  { id: 3, date: 'May 11, 7:02 AM',    type: 'Pre-Trip',  status: 'fail', issues: 2 },
  { id: 4, date: 'May 10, 6:45 PM',    type: 'Post-Trip', status: 'pass', issues: 0 },
  { id: 5, date: 'May 10, 7:15 AM',    type: 'Pre-Trip',  status: 'pass', issues: 0 },
]

// ─── Edit modal ───
const showEditModal = ref(false)

const form = ref({
  firstName: driver.name.split(' ')[0],
  lastName: driver.name.split(' ').slice(1).join(' '),
  email: driver.email, phone: driver.phone, birthday: driver.birthday,
  address: driver.address, emergencyName: driver.emergencyName, emergencyPhone: driver.emergencyPhone,
  licenseNo: driver.licenseNo, licenseClass: driver.licenseClass, licenseExpiry: driver.licenseExpiry,
  medCardNo: driver.medCardNo, medCardExpiry: driver.medCardExpiry,
  hireDate: driver.hireDate, status: driver.status, allowedVehicles: [...driver.allowedVehicles],
})

function toggleVehicleType(t: string) {
  const idx = form.value.allowedVehicles.indexOf(t)
  if (idx === -1) form.value.allowedVehicles.push(t)
  else form.value.allowedVehicles.splice(idx, 1)
}

function saveEdit() {
  Object.assign(driver, {
    name: `${form.value.firstName} ${form.value.lastName}`,
    email: form.value.email, phone: form.value.phone, birthday: form.value.birthday,
    address: form.value.address, emergencyName: form.value.emergencyName, emergencyPhone: form.value.emergencyPhone,
    licenseNo: form.value.licenseNo, licenseClass: form.value.licenseClass, licenseExpiry: form.value.licenseExpiry,
    medCardNo: form.value.medCardNo, medCardExpiry: form.value.medCardExpiry,
    hireDate: form.value.hireDate, status: form.value.status, allowedVehicles: [...form.value.allowedVehicles],
  })
  showEditModal.value = false
}
</script>

<style scoped>
.badge-blue   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
.badge-yellow { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
