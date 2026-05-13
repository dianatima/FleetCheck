<template>
  <AppLayout title="Repair Requests">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-3 mb-5">
      <div class="relative flex-1 min-w-40">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input class="input-field pl-9 py-2 text-sm" placeholder="Search repairs..." />
      </div>
      <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
        <option value="all">All Status</option>
        <option value="open">Open</option>
        <option value="in-progress">In Progress</option>
        <option value="waiting-parts">Waiting Parts</option>
        <option value="completed">Completed</option>
      </select>
      <button @click="showForm = true" class="btn-primary gap-2 text-sm"><Plus :size="16" /> New Request</button>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div v-for="s in summaryStats" :key="s.label" class="card p-3 text-center" :class="s.bg">
        <div class="text-2xl font-bold" :class="s.color">{{ s.count }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
      </div>
    </div>

    <!-- Repairs list -->
    <div class="space-y-3">
      <div v-for="r in filtered" :key="r.id" class="card p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <div class="w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Wrench :size="17" class="text-orange-500" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ r.issue }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ r.unit }} · {{ r.vehicle }}</p>
            </div>
          </div>
          <div class="flex gap-1.5 flex-shrink-0">
            <span :class="priorityBadge[r.priority]">{{ r.priority }}</span>
            <span :class="statusBadge[r.status]">{{ statusLabel[r.status] }}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div><span class="text-gray-400">Category</span><p class="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{{ r.category }}</p></div>
          <div><span class="text-gray-400">Reported By</span><p class="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{{ r.reporter }}</p></div>
          <div><span class="text-gray-400">Assigned To</span><p class="font-medium mt-0.5" :class="r.mechanic === 'Unassigned' ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'">{{ r.mechanic }}</p></div>
          <div><span class="text-gray-400">Est. Completion</span><p class="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{{ r.est }}</p></div>
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
          <span class="text-xs text-gray-400">Created: {{ r.created }}</span>
          <div class="flex gap-2">
            <button class="btn-secondary text-xs py-1 px-2.5">Update Status</button>
            <button class="btn-secondary text-xs py-1 px-2.5 gap-1"><Camera :size="11" /> Photos</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="showForm" class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 class="font-bold text-gray-900 dark:text-white">New Repair Request</h2>
            <button @click="showForm = false" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">✕</button>
          </div>
          <div class="p-5 space-y-4">
            <div><label class="label">Vehicle *</label><select class="input-field"><option v-for="r in repairs" :key="r.id">{{ r.unit }} – {{ r.vehicle }}</option></select></div>
            <div><label class="label">Issue Category *</label><select class="input-field"><option v-for="c in categories" :key="c">{{ c }}</option></select></div>
            <div><label class="label">Description *</label><textarea class="input-field resize-none" rows="3" placeholder="Describe the issue in detail..." /></div>
            <div>
              <label class="label">Priority *</label>
              <div class="grid grid-cols-4 gap-2">
                <button v-for="(p, i) in ['Low','Medium','High','Critical']" :key="p" class="py-2 rounded-lg border-2 text-xs font-semibold transition-all" :class="i === 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'">{{ p }}</button>
              </div>
            </div>
            <div><label class="label">Assign Mechanic</label><select class="input-field"><option>Tom Blake</option><option>Lisa Chen</option><option>Unassigned</option></select></div>
            <div>
              <label class="label">Photos</label>
              <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700">
                <Camera :size="20" class="mx-auto text-gray-400 mb-1" />
                <p class="text-xs text-gray-500">Add photos</p>
              </div>
            </div>
          </div>
          <div class="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
            <button @click="showForm = false" class="btn-secondary flex-1">Cancel</button>
            <button @click="showForm = false" class="btn-primary flex-1">Submit Request</button>
          </div>
        </div>
      </div>
    </Transition>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, Wrench, Camera } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'

const filterStatus = ref('all')
const showForm = ref(false)

const repairs = [
  { id: 1, unit: 'Unit #0781', vehicle: 'Peterbilt 579', issue: 'Left turn signal not working', category: 'Lights', priority: 'medium', status: 'open', reporter: 'Maria Garcia', mechanic: 'Tom Blake', created: 'Today 7:18 AM', est: 'May 13' },
  { id: 2, unit: 'Unit #1042', vehicle: 'Kenworth T680', issue: 'Low tire pressure – left rear', category: 'Tires', priority: 'high', status: 'in-progress', reporter: 'John Smith', mechanic: 'Tom Blake', created: 'Yesterday', est: 'Today' },
  { id: 3, unit: 'Unit #1099', vehicle: 'Genie S-65', issue: 'Hydraulic oil leak', category: 'Fluids', priority: 'critical', status: 'waiting-parts', reporter: 'Mike Brown', mechanic: 'Lisa Chen', created: 'May 10', est: 'May 15' },
  { id: 4, unit: 'Unit #2210', vehicle: 'Freightliner Cascadia', issue: 'Windshield wiper replacement', category: 'Exterior', priority: 'low', status: 'completed', reporter: 'David Lee', mechanic: 'Tom Blake', created: 'May 8', est: 'May 9' },
  { id: 5, unit: 'Unit #3305', vehicle: 'Ford F-350', issue: 'Brake pads worn', category: 'Brakes', priority: 'high', status: 'open', reporter: 'Sarah Johnson', mechanic: 'Unassigned', created: 'Today 6:42 AM', est: 'May 14' },
]

const categories = ['Tires', 'Lights', 'Brakes', 'Fluids', 'Engine', 'Exterior', 'Steering', 'Other']

const priorityBadge: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-orange', critical: 'badge-red' }
const statusBadge: Record<string, string> = { open: 'badge-red', 'in-progress': 'badge-orange', 'waiting-parts': 'badge-blue', completed: 'badge-green' }
const statusLabel: Record<string, string> = { open: 'Open', 'in-progress': 'In Progress', 'waiting-parts': 'Waiting Parts', completed: 'Completed' }

const summaryStats = computed(() => [
  { label: 'Open', count: repairs.filter(r => r.status === 'open').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  { label: 'In Progress', count: repairs.filter(r => r.status === 'in-progress').length, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { label: 'Waiting Parts', count: repairs.filter(r => r.status === 'waiting-parts').length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: 'Completed', count: repairs.filter(r => r.status === 'completed').length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
])

const filtered = computed(() => filterStatus.value === 'all' ? repairs : repairs.filter(r => r.status === filterStatus.value))
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
