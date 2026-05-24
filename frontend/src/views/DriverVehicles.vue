<template>
  <AppLayout :title="store.t('vehicles')">
    <div class="flex flex-wrap gap-2 mb-5">
      <button
        v-for="badge in statusBadges"
        :key="badge.value"
        type="button"
        :class="[
          badge.badgeClass,
          'transition-all whitespace-nowrap cursor-pointer',
          filterStatus === badge.value ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-950' : 'hover:opacity-85',
        ]"
        :aria-pressed="filterStatus === badge.value"
        @click="toggleStatusFilter(badge.value)"
      >
        {{ badge.count }} {{ badge.label }}
      </button>
    </div>

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

    <div v-if="loading" class="card p-6 text-sm text-gray-500">
      {{ store.t('loadingVehicles') }}
    </div>

    <div v-else-if="error" class="card p-6 text-sm text-red-500">
      {{ error }}
    </div>

    <div v-else class="card overflow-hidden">
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
              <td class="px-4 py-3 cursor-pointer" @click="openVehicle(v.id)">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <img v-if="v.photo_url" :src="v.photo_url" alt="" class="w-full h-full object-cover" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ getVehicleName(v) }}</p>
                    <p class="text-xs font-mono text-gray-400">{{ v.unit }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" @click="openVehicle(v.id)">{{ getVehicleTypeLabel(v.type, store.language) }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" @click="openVehicle(v.id)">{{ v.year ?? '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="openVehicle(v.id)">{{ v.plate }}</td>
              <td class="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap cursor-pointer" @click="openVehicle(v.id)">{{ v.vin ? v.vin.substring(0, 12) + '…' : '—' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer" @click="openVehicle(v.id)">{{ v.odometer != null ? v.odometer.toLocaleString() + ' mi' : '—' }}</td>
              <td class="px-4 py-3 cursor-pointer" @click="openVehicle(v.id)"><span :class="statusConfig[v.status]?.badge || 'badge-gray'">{{ statusConfig[v.status]?.label || v.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Filter } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchCompanyVehicles, type CompanyVehicle } from '@/lib/companyVehicles'
import { getVehicleTypeLabel } from '@/lib/vehicleCatalog'

const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const search = ref('')
const filterStatus = ref('all')
const loading = ref(false)
const error = ref('')
const vehicles = ref<CompanyVehicle[]>([])

const statusConfig = computed<Record<string, { label: string; badge: string }>>(() => ({
  active: { label: store.t('statusActive'), badge: 'badge-green' },
  'needs-attention': { label: store.t('statusNeedsAttention'), badge: 'badge-orange' },
  blocked: { label: store.t('statusBlocked'), badge: 'badge-red' },
  'in-repair': { label: store.t('statusInRepair'), badge: 'badge-gray' },
}))

const statusBadges = computed(() => [
  { value: 'active', label: store.t('statusActive'), count: vehicles.value.filter((vehicle) => vehicle.status === 'active').length, badgeClass: 'badge-green' },
  { value: 'needs-attention', label: store.t('statusNeedsAttention'), count: vehicles.value.filter((vehicle) => vehicle.status === 'needs-attention').length, badgeClass: 'badge-orange' },
  { value: 'blocked', label: store.t('statusBlocked'), count: vehicles.value.filter((vehicle) => vehicle.status === 'blocked').length, badgeClass: 'badge-red' },
  { value: 'in-repair', label: store.t('statusInRepair'), count: vehicles.value.filter((vehicle) => vehicle.status === 'in-repair').length, badgeClass: 'badge-gray' },
])

function getVehicleName(vehicle: CompanyVehicle) {
  return `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.unit
}

function toggleStatusFilter(status: string) {
  filterStatus.value = filterStatus.value === status ? 'all' : status
}

function openVehicle(vehicleId: string) {
  void router.push(`/vehicles/${vehicleId}`)
}

function normalizeVehicleStatus(value: unknown) {
  return typeof value === 'string' && ['active', 'needs-attention', 'blocked', 'in-repair'].includes(value) ? value : 'all'
}

async function loadVehicles() {
  error.value = ''

  if (!authStore.companyId) {
    vehicles.value = []
    return
  }

  loading.value = true

  try {
    vehicles.value = await fetchCompanyVehicles(authStore.companyId, {
      assignedToAuthUserId: authStore.user?.id || null,
    })
  } catch (loadError: any) {
    error.value = loadError?.message || store.t('unableToLoadVehicles')
    vehicles.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadVehicles)

watch(() => authStore.companyId, loadVehicles)
watch(
  () => route.query.status,
  (status) => {
    filterStatus.value = normalizeVehicleStatus(status)
  },
  { immediate: true },
)

const filtered = computed(() => vehicles.value.filter((vehicle) => {
  const q = search.value.toLowerCase()
  const matchSearch = getVehicleName(vehicle).toLowerCase().includes(q)
    || vehicle.unit.toLowerCase().includes(q)
    || vehicle.plate.toLowerCase().includes(q)

  return matchSearch && (filterStatus.value === 'all' || vehicle.status === filterStatus.value)
}))
</script>

<style scoped>
.badge-orange { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
</style>
