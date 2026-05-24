<template>
  <AppLayout :title="store.t('repairRequests')">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-4 text-center">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" :placeholder="store.t('searchRepairs')" />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allStatus') }}</option>
          <option value="open">{{ store.t('statusOpen') }}</option>
          <option value="in-progress">{{ store.t('statusInProgress') }}</option>
          <option value="completed">{{ store.t('statusCompleted') }}</option>
          <option value="cancelled">{{ store.t('statusCancelled') }}</option>
        </select>
        <select v-model="filterPriority" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t('allPriority') }}</option>
          <option value="high">{{ store.t('priorityHigh') }}</option>
          <option value="medium">{{ store.t('priorityMedium') }}</option>
          <option value="low">{{ store.t('priorityLow') }}</option>
        </select>
      </div>
      <button @click="openAdd" class="btn-primary gap-2 text-sm"><Plus :size="16" /> {{ store.t('newRequest') }}</button>
    </div>

    <!-- Table (list) or Detail -->
    <div v-if="!selectedRepair">
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th v-for="h in repairHeaders" :key="h"
                  class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filtered.length === 0">
                <td colspan="7" class="text-center py-12 text-sm text-gray-400">{{ store.t('noRepairsFound') }}</td>
              </tr>
              <tr v-for="r in filtered" :key="r.id"
                class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                @click="selectedRepair = r">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench :size="14" class="text-orange-500" />
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white max-w-56 truncate block">{{ r.title }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.vehicle }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.category }}</td>
                <td class="px-4 py-3"><span :class="priorityBadge[r.priority]">{{ priorityLabel[r.priority] }}</span></td>
                <td class="px-4 py-3"><span :class="statusBadge[r.status]">{{ statusLabel[r.status] }}</span></td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ r.createdBy }}</td>
                <td class="px-4 py-3" @click.stop>
                  <div class="flex items-center gap-1">
                    <button @click="selectedRepair = r" class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors whitespace-nowrap">
                      <Eye :size="12" /> {{ store.t('view') }}
                    </button>
                    <button @click="openEdit(r)" class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <Pencil :size="13" />
                    </button>
                    <button @click="confirmDelete(r)" class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 :size="13" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('showing') }} {{ filtered.length }} {{ store.t('of') }} {{ repairs.length }}</span>
        </div>
      </div>
    </div>

    <!-- Detail view (in-place) -->
    <div v-if="selectedRepair" class="space-y-5">
      <button @click="selectedRepair = null" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors">
        <ArrowLeft :size="16" /> {{ store.t('backToRepairs') }}
      </button>

      <div class="card overflow-hidden">
        <div class="p-5 border-b border-gray-100 dark:border-gray-700">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wrench :size="22" class="text-orange-500" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedRepair.title }}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ selectedRepair.vehicle }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span :class="priorityBadge[selectedRepair.priority]">{{ priorityLabel[selectedRepair.priority] }}</span>
              <span :class="statusBadge[selectedRepair.status]">{{ statusLabel[selectedRepair.status] }}</span>
            </div>
          </div>
        </div>
        <div class="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 flex gap-2">
          <button @click="openEdit(selectedRepair)" class="btn-secondary gap-2 text-sm"><Pencil :size="14" /> {{ store.t('edit') }}</button>
          <button @click="confirmDelete(selectedRepair)" class="btn-secondary gap-2 text-sm text-red-500 hover:text-red-600"><Trash2 :size="14" /> {{ store.t('delete') }}</button>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2">
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">{{ store.t('repairInformation') }}</h3>
            <div class="space-y-4">
              <div v-if="selectedRepair.description">
                <span class="text-xs text-gray-400 block mb-1">{{ store.t('description') }}</span>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ selectedRepair.description }}</p>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div v-if="selectedRepair.category">
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('category') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.category }}</p>
                </div>
                <div v-if="selectedRepair.driver">
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('driver') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.driver }}</p>
                </div>
                <div v-if="selectedRepair.inspection">
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('inspectionLabel') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.inspection }}</p>
                </div>
                <div v-if="selectedRepair.relatedIssueId">
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('relatedIssue') }}</span>
                  <RouterLink :to="`/issues/${selectedRepair.relatedIssueNumId}`" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <ExternalLink :size="12" /> {{ selectedRepair.relatedIssueId }}
                  </RouterLink>
                </div>
                <div>
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('reportedBy') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.createdBy }}</p>
                </div>
                <div>
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('createdAt') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.createdAt }}</p>
                </div>
                <div v-if="selectedRepair.startedAt">
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('startedAt') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.startedAt }}</p>
                </div>
                <div v-if="selectedRepair.completedAt">
                  <span class="text-xs text-gray-400 block mb-1">{{ store.t('completedAt') }}</span>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.completedAt }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="card p-5">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Truck :size="15" class="text-blue-500" /> {{ store.t('vehicle') }}
            </h3>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedRepair.vehicle }}</p>
            <RouterLink to="/vehicles" class="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ExternalLink :size="12" /> {{ store.t('openVehicleCard') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeForm" />
          <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style="max-height:90vh">
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 rounded-t-2xl">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editingId ? store.t('editRepair') : store.t('repairRequests') }}</h2>
              <button @click="closeForm" class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X :size="18" /></button>
            </div>
            <form @submit.prevent="handleSave" class="p-6 space-y-4 overflow-y-auto">
              <div>
                <label class="label">{{ store.t('vehicle') }} <span class="text-red-500">*</span></label>
                <select v-model="form.vehicleId" class="input-field" required>
                  <option value="" disabled>{{ store.t('selectVehicle') }}</option>
                  <option v-for="v in vehicleOptions" :key="v.id" :value="v.id">{{ v.unit }} – {{ v.name }}</option>
                </select>
              </div>
              <div>
                <label class="label">{{ store.t('repairTitle') }} <span class="text-red-500">*</span></label>
                <input v-model="form.title" class="input-field" placeholder="Short title for this repair" required />
              </div>
              <div>
                <label class="label">{{ store.t('description') }}</label>
                <textarea v-model="form.description" class="input-field resize-none" rows="3" placeholder="Detailed description..." />
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('issueCategory') }} <span class="text-red-500">*</span></label>
                  <select v-model="form.category" class="input-field" required>
                    <option value="" disabled>{{ store.t('selectCategory') }}</option>
                    <option v-for="c in categories" :key="c">{{ c }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">{{ store.t('driver') }}</label>
                  <select v-model="form.driver" class="input-field">
                    <option value="">{{ store.t('none') }}</option>
                    <option v-for="d in driverOptions" :key="d">{{ d }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="label">{{ store.t('relatedIssue') }}</label>
                <select v-model="form.relatedIssueNumId" class="input-field">
                  <option :value="null">{{ store.t('none') }}</option>
                  <option v-for="i in issueOptions" :key="i.id" :value="i.id">{{ i.issueId }} – {{ i.title }}</option>
                </select>
              </div>
              <div>
                <label class="label">{{ store.t('priority') }} <span class="text-red-500">*</span></label>
                <div class="grid grid-cols-3 gap-2">
                  <button v-for="p in ['low','medium','high']" :key="p" type="button"
                    @click="form.priority = p"
                    class="py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all"
                    :class="form.priority === p ? priorityActive[p] : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'">{{ priorityLabel[p] }}</button>
                </div>
              </div>
              <div>
                <label class="label">{{ store.t('status') }} <span class="text-red-500">*</span></label>
                <div class="grid grid-cols-2 gap-2">
                  <button v-for="s in statusOptions" :key="s.value" type="button"
                    @click="form.status = s.value"
                    class="py-2 rounded-xl border-2 text-xs font-semibold transition-all"
                    :class="form.status === s.value ? statusActive[s.value] : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'">{{ s.label }}</button>
                </div>
              </div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t('startedAt') }}</label>
                  <input v-model="form.startedAt" class="input-field" type="date" />
                </div>
                <div>
                  <label class="label">{{ store.t('completedAt') }}</label>
                  <input v-model="form.completedAt" class="input-field" type="date" />
                </div>
              </div>
              <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" @click="closeForm" class="btn-secondary flex-1">{{ store.t('cancel') }}</button>
                <button type="submit" class="btn-primary flex-1 gap-2"><Save :size="15" /> {{ editingId ? store.t('saveChanges') : store.t('submitRequest') }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Filter, Plus, Wrench, Pencil, Trash2, X, Save, Eye, Truck, ArrowLeft, ExternalLink } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchCompanyVehicles } from '@/lib/companyVehicles'

const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()

const categories = ['Tires', 'Lights', 'Brakes', 'Fluids', 'Engine', 'Exterior', 'Steering', 'Other']
const staticVehicleOptions = [
  { id: 1, unit: 'Unit #1042', name: 'Kenworth T680' },
  { id: 2, unit: 'Unit #0781', name: 'Peterbilt 579' },
  { id: 3, unit: 'Unit #2210', name: 'Freightliner Cascadia' },
  { id: 4, unit: 'Unit #0521', name: 'Volvo VNL 860' },
  { id: 5, unit: 'Unit #3305', name: 'Ford F-350' },
  { id: 6, unit: 'Unit #1099', name: 'Genie S-65' },
]
const liveVehicleOptions = ref<{ id: string; unit: string; name: string }[]>([])
const vehicleOptions = computed(() => {
  const merged = [...staticVehicleOptions, ...liveVehicleOptions.value]
  const seen = new Set<string>()

  return merged.filter((vehicle) => {
    const key = String(vehicle.id)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
})
const driverOptions = ['John Smith', 'Maria Garcia', 'David Lee', 'Sarah Johnson', 'James Carter', 'Mike Brown']
const issueOptions = [
  { id: 1, issueId: 'ISS-001', title: 'Left turn signal not working' },
  { id: 2, issueId: 'ISS-002', title: 'Brake fluid level low' },
  { id: 3, issueId: 'ISS-003', title: 'Oil pressure warning light on' },
  { id: 7, issueId: 'ISS-007', title: 'Brake pads worn below minimum' },
]
const statusOptions = computed(() => [
  { value: 'open',        label: store.t('statusOpen') },
  { value: 'in-progress', label: store.t('statusInProgress') },
  { value: 'completed',   label: store.t('statusCompleted') },
  { value: 'cancelled',   label: store.t('statusCancelled') },
])

const priorityBadge: Record<string, string>  = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-orange' }
const priorityActive: Record<string, string> = {
  low:    'bg-gray-600 border-gray-600 text-white',
  medium: 'bg-blue-600 border-blue-600 text-white',
  high:   'bg-orange-500 border-orange-500 text-white',
}
const statusBadge: Record<string, string>  = { open: 'badge-red', 'in-progress': 'badge-orange', completed: 'badge-green', cancelled: 'badge-gray' }
const statusActive: Record<string, string> = {
  open:          'bg-red-600 border-red-600 text-white',
  'in-progress': 'bg-orange-500 border-orange-500 text-white',
  completed:     'bg-green-600 border-green-600 text-white',
  cancelled:     'bg-gray-600 border-gray-600 text-white',
}
const statusLabel = computed((): Record<string, string> => ({
  open: store.t('statusOpen'),
  'in-progress': store.t('statusInProgress'),
  completed: store.t('statusCompleted'),
  cancelled: store.t('statusCancelled'),
}))

const priorityLabel = computed((): Record<string, string> => ({
  low: store.t('priorityLow'),
  medium: store.t('priorityMedium'),
  high: store.t('priorityHigh'),
}))

const repairHeaders = computed(() => [
  store.t('issue'),
  store.t('vehicle'),
  store.t('category'),
  store.t('priority'),
  store.t('status'),
  store.t('reportedBy'),
  store.t('actions'),
])

interface Repair {
  id: number; vehicleId: string | number; vehicle: string
  title: string; description: string; category: string
  relatedIssueNumId: number | null; relatedIssueId: string
  driver: string; inspection: string
  priority: string; status: string
  createdBy: string; createdAt: string
  startedAt: string; completedAt: string
}

const repairs = ref<Repair[]>([
  { id: 1, vehicleId: 2, vehicle: 'Unit #0781 · Peterbilt 579',   title: 'Left turn signal repair',             description: 'Replace faulty relay and check wiring harness.', category: 'Lights',   relatedIssueNumId: 1, relatedIssueId: 'ISS-001', driver: 'Maria Garcia',  inspection: 'Pre-Trip May 12', priority: 'medium', status: 'in-progress', createdBy: 'Maria Garcia',  createdAt: 'Today 7:18 AM',  startedAt: '2026-05-12', completedAt: '' },
  { id: 2, vehicleId: 1, vehicle: 'Unit #1042 · Kenworth T680',   title: 'Brake fluid top-up & leak inspection', description: 'Top up fluid, inspect lines and master cylinder.', category: 'Brakes',   relatedIssueNumId: 2, relatedIssueId: 'ISS-002', driver: 'John Smith',    inspection: 'Pre-Trip May 11', priority: 'high',   status: 'open',        createdBy: 'John Smith',    createdAt: 'Yesterday',      startedAt: '',           completedAt: '' },
  { id: 3, vehicleId: 4, vehicle: 'Unit #0521 · Volvo VNL 860',   title: 'Hydraulic oil leak repair',            description: 'Seal kit ordered, awaiting parts.',              category: 'Fluids',   relatedIssueNumId: 3, relatedIssueId: 'ISS-003', driver: 'James Carter',  inspection: 'Pre-Trip May 10', priority: 'high',   status: 'in-progress', createdBy: 'James Carter',  createdAt: 'May 10',         startedAt: '2026-05-10', completedAt: '' },
  { id: 4, vehicleId: 3, vehicle: 'Unit #2210 · Freightliner',    title: 'Windshield wiper replacement',         description: 'Both front blades replaced with OEM parts.',     category: 'Exterior', relatedIssueNumId: null, relatedIssueId: '',      driver: 'David Lee',     inspection: '',                priority: 'low',    status: 'completed',   createdBy: 'David Lee',     createdAt: 'May 8',          startedAt: '2026-05-09', completedAt: '2026-05-09' },
  { id: 5, vehicleId: 5, vehicle: 'Unit #3305 · Ford F-350',      title: 'Front axle brake pad replacement',     description: 'Front pads at 10%, inspect rotors.',             category: 'Brakes',   relatedIssueNumId: 7, relatedIssueId: 'ISS-007', driver: 'Sarah Johnson', inspection: 'Pre-Trip May 11', priority: 'high',   status: 'open',        createdBy: 'Sarah Johnson', createdAt: 'Today 6:42 AM',  startedAt: '',           completedAt: '' },
])

const search = ref('')
const filterStatus = ref('all')
const filterPriority = ref('all')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const selectedRepair = ref<Repair | null>(null)

const defaultForm = () => ({ vehicleId: '' as string | number, title: '', description: '', category: '', relatedIssueNumId: null as number | null, relatedIssueId: '', driver: '', inspection: '', priority: 'medium', status: 'open', startedAt: '', completedAt: '' })
const form = reactive(defaultForm())

function openAdd(preselectedVehicleId?: string | number) {
  Object.assign(form, defaultForm(), preselectedVehicleId ? { vehicleId: preselectedVehicleId } : {})
  editingId.value = null
  showForm.value = true
}
function openEdit(r: Repair) {
  Object.assign(form, { vehicleId: r.vehicleId, title: r.title, description: r.description, category: r.category, relatedIssueNumId: r.relatedIssueNumId, relatedIssueId: r.relatedIssueId, driver: r.driver, inspection: r.inspection, priority: r.priority, status: r.status, startedAt: r.startedAt, completedAt: r.completedAt })
  editingId.value = r.id; showForm.value = true
}
function closeForm() { showForm.value = false; editingId.value = null }
function confirmDelete(r: Repair) {
  if (confirm(`Delete repair "${r.title}"?`)) {
    repairs.value = repairs.value.filter(x => x.id !== r.id)
    if (selectedRepair.value?.id === r.id) selectedRepair.value = null
  }
}

let nextId = 100
function handleSave() {
  const veh = vehicleOptions.value.find(v => String(v.id) === String(form.vehicleId))
  if (!veh) return
  const issue = form.relatedIssueNumId ? issueOptions.find(i => i.id === form.relatedIssueNumId) : null
  const vehicleName = `${veh.unit} · ${veh.name}`
  if (editingId.value !== null) {
    const idx = repairs.value.findIndex(r => r.id === editingId.value)
    if (idx !== -1) {
      Object.assign(repairs.value[idx], { vehicleId: form.vehicleId, vehicle: vehicleName, title: form.title, description: form.description, category: form.category, relatedIssueNumId: form.relatedIssueNumId, relatedIssueId: issue?.issueId ?? '', driver: form.driver, inspection: form.inspection, priority: form.priority, status: form.status, startedAt: form.startedAt, completedAt: form.completedAt })
      if (selectedRepair.value?.id === editingId.value) selectedRepair.value = repairs.value[idx]
    }
  } else {
    const now = new Date()
    const createdAt = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    repairs.value.unshift({ id: ++nextId, vehicleId: form.vehicleId, vehicle: vehicleName, title: form.title, description: form.description, category: form.category, relatedIssueNumId: form.relatedIssueNumId, relatedIssueId: issue?.issueId ?? '', driver: form.driver, inspection: form.inspection, priority: form.priority, status: form.status, createdBy: 'James Davis', createdAt, startedAt: form.startedAt, completedAt: form.completedAt })
  }
  closeForm()
}

async function loadVehicleOptions() {
  if (!authStore.companyId) {
    liveVehicleOptions.value = []
    return
  }

  try {
    const vehicles = await fetchCompanyVehicles(authStore.companyId, authStore.role === 'driver'
      ? { assignedToAuthUserId: authStore.user?.id || null }
      : {})

    liveVehicleOptions.value = vehicles.map((vehicle) => ({
      id: vehicle.id,
      unit: `Unit #${vehicle.unit}`,
      name: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.plate || vehicle.type,
    }))
  } catch {
    liveVehicleOptions.value = []
  }
}

function applyLauncherQuery() {
  const shouldOpenCreate = route.query.create === '1'
  const vehicleId = typeof route.query.vehicleId === 'string' ? route.query.vehicleId : ''

  if (shouldOpenCreate) {
    openAdd(vehicleId || undefined)
  }
}

const summaryStats = computed(() => [
  { label: store.t('statusOpen'),        count: repairs.value.filter(r => r.status === 'open').length,        color: 'text-red-600 dark:text-red-400' },
  { label: store.t('statusInProgress'), count: repairs.value.filter(r => r.status === 'in-progress').length, color: 'text-orange-600 dark:text-orange-400' },
  { label: store.t('statusCompleted'),   count: repairs.value.filter(r => r.status === 'completed').length,   color: 'text-green-600 dark:text-green-400' },
  { label: store.t('statusCancelled'),   count: repairs.value.filter(r => r.status === 'cancelled').length,   color: 'text-gray-500 dark:text-gray-400' },
])

const filtered = computed(() => repairs.value.filter(r => {
  const q = search.value.toLowerCase()
  const matchSearch = r.title.toLowerCase().includes(q) || r.vehicle.toLowerCase().includes(q)
  return matchSearch && (filterStatus.value === 'all' || r.status === filterStatus.value) && (filterPriority.value === 'all' || r.priority === filterPriority.value)
}))

onMounted(async () => {
  await loadVehicleOptions()
  applyLauncherQuery()
})

watch(() => authStore.companyId, loadVehicleOptions)
watch(() => route.query.create, applyLauncherQuery)
watch(() => route.query.vehicleId, applyLauncherQuery)
</script>

<style scoped>
.badge-blue   { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400; }
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
