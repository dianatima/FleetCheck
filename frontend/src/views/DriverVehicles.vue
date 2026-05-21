<template>
  <AppLayout title="Vehicles">
    <!-- Summary badges -->
    <div class="flex flex-wrap gap-2 mb-5">
      <span class="badge-green">{{ vehicles.filter(v => v.status === 'active').length }} {{ store.t('statusActive') }}</span>
      <span class="badge-orange">{{ vehicles.filter(v => v.status === 'needs-attention').length }} {{ store.t('statusNeedsAttention') }}</span>
      <span class="badge-red">{{ vehicles.filter(v => v.status === 'blocked').length }} {{ store.t('statusBlocked') }}</span>
      <span class="badge-gray">{{ vehicles.filter(v => v.status === 'in-repair').length }} {{ store.t('statusInRepair') }}</span>
    </div>

    <!-- Search & filter -->
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
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th v-for="h in [store.t('vehicle'), store.t('type'), store.t('year'), store.t('plate'), store.t('vin'), store.t('odometer'), store.t('status')]" :key="h"
                class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="7" class="text-center py-12 text-sm text-gray-400">{{ store.t('noVehiclesFound') }}</td>
            </tr>
            <tr v-for="v in filtered" :key="v.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td class="px-4 py-3">
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
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ v.vehicle_types.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ v.year ?? '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ v.plate }}</td>
              <td class="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap">{{ v.vin !== 'N/A' ? v.vin.substring(0, 12) + '…' : '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ v.odometer != null ? v.odometer.toLocaleString() + ' mi' : '—' }}</td>
              <td class="px-4 py-3"><span :class="statusConfig[v.status].badge">{{ statusConfig[v.status].label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Filter } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
const store = useAppStore()

const search = ref('')
const filterStatus = ref('all')

const statusConfig = computed<Record<string, { label: string; badge: string }>>(() => ({
  active: { label: store.t('statusActive'), badge: 'badge-green' },
  'needs-attention': { label: store.t('statusNeedsAttention'), badge: 'badge-orange' },
  blocked: { label: store.t('statusBlocked'), badge: 'badge-red' },
  'in-repair': { label: store.t('statusInRepair'), badge: 'badge-gray' },
}))

const vehicles = ref([
  { id: 1, unit: '#1042', name: 'Kenworth T680',        plate: 'ABC-1234', vin: '1XKAD49X1EJ301042', vehicle_types: { name: 'Truck' },     year: 2022, odometer: 84200,  status: 'active',          photo: 'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=200' },
  { id: 2, unit: '#0781', name: 'Peterbilt 579',         plate: 'XYZ-5678', vin: '1XPWD49X2EN781234', vehicle_types: { name: 'Truck' },     year: 2021, odometer: 123500, status: 'needs-attention', photo: 'https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=200' },
  { id: 3, unit: '#2210', name: 'Freightliner Cascadia', plate: 'DEF-9012', vin: '3AKJGLD57ESDC2210', vehicle_types: { name: 'Truck' },     year: 2023, odometer: 47800,  status: 'active',          photo: 'https://images.pexels.com/photos/5025642/pexels-photo-5025642.jpeg?w=200' },
  { id: 4, unit: '#0521', name: 'Volvo VNL 860',         plate: 'GHI-3456', vin: '4V4NC9EH4EN521096', vehicle_types: { name: 'Truck' },     year: 2020, odometer: 198000, status: 'blocked',         photo: 'https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=200' },
  { id: 5, unit: '#3305', name: 'Ford F-350',            plate: 'JKL-7890', vin: '1FT8W3BT5NEC33050', vehicle_types: { name: 'Pickup' },    year: 2024, odometer: 12300,  status: 'active',          photo: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=200' },
  { id: 6, unit: '#1099', name: 'Genie S-65 Boom Lift',  plate: 'N/A',      vin: 'GS65A109900199',    vehicle_types: { name: 'Equipment' }, year: 2019, odometer: 0,      status: 'in-repair',       photo: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?w=200' },
])

const filtered = computed(() => vehicles.value.filter(v => {
  const q = search.value.toLowerCase()
  const matchSearch = v.name.toLowerCase().includes(q) || v.unit.includes(q) || v.plate.toLowerCase().includes(q)
  return matchSearch && (filterStatus.value === 'all' || v.status === filterStatus.value)
}))
</script>

<style scoped>
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
</style>
