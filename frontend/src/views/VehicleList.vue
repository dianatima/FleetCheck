<template>
  <AppLayout title="Fleet Vehicles">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="input-field pl-9 py-2 text-sm" placeholder="Search vehicles..." />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="needs-repair">Needs Repair</option>
          <option value="out-of-service">Out of Service</option>
        </select>
      </div>
      <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button v-for="v in ['grid','list']" :key="v" @click="viewMode = v" class="px-3 py-2 text-xs font-medium transition-colors" :class="viewMode === v ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'">{{ v === 'grid' ? '⊞' : '≡' }}</button>
      </div>
      <button class="btn-primary gap-2 text-sm"><Plus :size="16" /> Add Vehicle</button>
    </div>

    <!-- Summary badges -->
    <div class="flex flex-wrap gap-2 mb-5">
      <span class="badge-green">{{ vehicles.filter(v => v.status === 'active').length }} Active</span>
      <span class="badge-orange">{{ vehicles.filter(v => v.status === 'needs-repair').length }} Needs Repair</span>
      <span class="badge-red">{{ vehicles.filter(v => v.status === 'out-of-service').length }} Out of Service</span>
    </div>

    <!-- Grid view -->
    <div v-if="viewMode === 'grid'" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <RouterLink v-for="v in filtered" :key="v.id" :to="`/vehicles/${v.id}`" class="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer block">
        <div class="h-36 bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
          <img :src="v.photo" :alt="v.name" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
          <div class="absolute top-2 right-2"><span :class="statusConfig[v.status].badge">{{ statusConfig[v.status].label }}</span></div>
          <div class="absolute top-2 left-2"><span class="badge-gray">{{ v.type }}</span></div>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">{{ v.name }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Unit {{ v.unit }} · {{ v.plate }}</p>
          <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex justify-between"><span>Driver</span><span class="font-medium text-gray-700 dark:text-gray-300">{{ v.driver }}</span></div>
            <div class="flex justify-between"><span>Last Inspection</span><span class="font-medium text-gray-700 dark:text-gray-300">{{ v.lastInsp }}</span></div>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- List view -->
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th v-for="h in ['Vehicle','Unit','Plate/VIN','Type','Driver','Last Inspection','Status','']" :key="h" class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filtered" :key="v.id" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer" @click="router.push(`/vehicles/${v.id}`)">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  <img :src="v.photo" alt="" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ v.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">{{ v.unit }}</td>
            <td class="px-4 py-3">
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ v.plate }}</p>
              <p class="text-[10px] text-gray-400 font-mono">{{ v.vin.substring(0, 10) }}...</p>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ v.type }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ v.driver }}</td>
            <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ v.lastInsp }}</td>
            <td class="px-4 py-3"><span :class="statusConfig[v.status].badge">{{ statusConfig[v.status].label }}</span></td>
            <td class="px-4 py-3"><ChevronRight :size="16" class="text-gray-400" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Plus, ChevronRight } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'

const router = useRouter()
const search = ref('')
const filterStatus = ref('all')
const viewMode = ref('grid')

const vehicles = [
  { id: 1, unit: '#1042', name: 'Kenworth T680', plate: 'ABC-1234', vin: '1XKAD49X1EJ301042', type: 'Semi Truck', status: 'active', lastInsp: 'Today 7:24 AM', driver: 'John Smith', photo: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=200' },
  { id: 2, unit: '#0781', name: 'Peterbilt 579', plate: 'XYZ-5678', vin: '1XPWD49X2EN781234', type: 'Semi Truck', status: 'needs-repair', lastInsp: 'Yesterday 6:15 PM', driver: 'Maria Garcia', photo: 'https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=200' },
  { id: 3, unit: '#2210', name: 'Freightliner Cascadia', plate: 'DEF-9012', vin: '3AKJGLD57ESDC2210', type: 'Semi Truck', status: 'active', lastInsp: 'Today 6:55 AM', driver: 'David Lee', photo: 'https://images.pexels.com/photos/5025642/pexels-photo-5025642.jpeg?w=200' },
  { id: 4, unit: '#0521', name: 'Volvo VNL 860', plate: 'GHI-3456', vin: '4V4NC9EH4EN521096', type: 'Semi Truck', status: 'out-of-service', lastInsp: 'May 10, 8:00 AM', driver: 'Unassigned', photo: 'https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=200' },
  { id: 5, unit: '#3305', name: 'Ford F-350', plate: 'JKL-7890', vin: '1FT8W3BT5NEC33050', type: 'Pickup Truck', status: 'active', lastInsp: 'Today 6:42 AM', driver: 'Sarah Johnson', photo: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=200' },
  { id: 6, unit: '#1099', name: 'Genie S-65 Boom Lift', plate: 'N/A', vin: 'GS65A109900199', type: 'Boom Lift', status: 'needs-repair', lastInsp: 'Yesterday', driver: 'Mike Brown', photo: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?w=200' },
]

const statusConfig: Record<string, { label: string; badge: string }> = {
  active: { label: 'Active', badge: 'badge-green' },
  'needs-repair': { label: 'Needs Repair', badge: 'badge-orange' },
  'out-of-service': { label: 'Out of Service', badge: 'badge-red' },
}

const filtered = computed(() => vehicles.filter(v => {
  const matchSearch = v.name.toLowerCase().includes(search.value.toLowerCase()) || v.unit.includes(search.value) || v.plate.toLowerCase().includes(search.value.toLowerCase())
  const matchStatus = filterStatus.value === 'all' || v.status === filterStatus.value
  return matchSearch && matchStatus
}))
</script>
