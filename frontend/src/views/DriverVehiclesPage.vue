<template>
  <AppLayout title="My Vehicles">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          :placeholder="store.t('searchVehicles')"
        />
      </div>
      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="vehicleStore.availabilityFilter"
          class="input-field py-2 text-sm w-auto"
          @change="vehicleStore.setAvailabilityFilter(vehicleStore.availabilityFilter)"
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned to me</option>
          <option value="unavailable">Unavailable</option>
          <option value="repair">In repair</option>
        </select>
      </div>
    </div>

    <div v-if="vehicleStore.loading" class="card p-6 text-sm text-gray-500">
      Loading vehicles...
    </div>
    <div v-else-if="vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ vehicleStore.error }}
    </div>
    <template v-else>
      <div
        v-if="vehicleStore.activeAssignment"
        class="card p-4 mb-5 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
      >
        Complete post-trip inspection for your assigned vehicle first.
      </div>

      <div class="flex flex-wrap gap-2 mb-5">
        <span class="badge-green">{{ countBy("available") }} Available</span>
        <span class="badge-blue">{{ countBy("assigned") }} Assigned to you</span>
        <span class="badge-orange">{{ countBy("repair") }} In repair</span>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th v-for="header in headers" :key="header" class="table-th">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="vehicles.length === 0">
                <td :colspan="headers.length" class="px-4 py-12 text-center text-sm text-gray-400">
                  No vehicles are available for your license class.
                </td>
              </tr>
              <tr
                v-for="vehicle in vehicles"
                :key="vehicle.id"
                class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="px-4 py-3 cursor-pointer" @click="openDetail(vehicle.id)">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        v-if="vehicle.photo_url"
                        :src="vehicle.photo_url"
                        alt=""
                        class="w-full h-full object-cover"
                        @error="hideBrokenImage"
                      />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {{ vehicleName(vehicle) }}
                      </p>
                      <p class="text-xs font-mono text-gray-400">{{ vehicle.unit }}</p>
                    </div>
                  </div>
                </td>
                <td class="table-td cursor-pointer" @click="openDetail(vehicle.id)">
                  {{ vehicle.vehicle_types?.name || "—" }}
                </td>
                <td class="table-td cursor-pointer" @click="openDetail(vehicle.id)">
                  {{ vehicle.plate || "—" }}
                </td>
                <td class="table-td cursor-pointer" @click="openDetail(vehicle.id)">
                  {{ vehicle.odometer != null ? `${Number(vehicle.odometer).toLocaleString()} mi` : "—" }}
                </td>
                <td class="px-4 py-3 cursor-pointer" @click="openDetail(vehicle.id)">
                  <span :class="availabilityBadge(vehicle)">
                    {{ availabilityLabel(vehicle) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button class="icon-btn" title="View vehicle" @click="openDetail(vehicle.id)">
                      <Eye :size="15" />
                    </button>
                    <button
                      class="btn-primary px-2 py-1.5 text-xs whitespace-nowrap"
                      :disabled="!vehicle.available || startingId === vehicle.id"
                      @click="startPreTrip(vehicle)"
                    >
                      Pre-trip
                    </button>
                    <button
                      class="btn-secondary px-2 py-1.5 text-xs whitespace-nowrap"
                      :disabled="!vehicle.post_trip_ready || startingId === vehicle.id"
                      @click="startPostTrip(vehicle)"
                    >
                      Post-trip
                    </button>
                  </div>
                  <p v-if="vehicle.awaiting_manager_review" class="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
                    Manager review required before post-trip
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <BaseTablePagination
          :total="vehicleStore.total"
          :current-page="vehicleStore.page"
          :page-size="vehicleStore.pageSize"
          @update:current-page="vehicleStore.setPage"
          @update:page-size="vehicleStore.setPageSize"
        />
      </div>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Filter, Search } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseTablePagination from '@/components/shared/BaseTablePagination.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/authStore'
import { useDriverVehicleStore } from '@/stores/driverVehicleStore'

const store = useAppStore()
const authStore = useAuthStore()
const vehicleStore = useDriverVehicleStore()
const router = useRouter()
const localSearch = ref(vehicleStore.search)
const startingId = ref('')
const headers = ['Vehicle', 'Vehicle type', 'Plate', 'Odometer', 'Availability', 'Actions']
let searchTimer: ReturnType<typeof setTimeout> | null = null

const vehicles = computed(() => vehicleStore.vehicles)
watch(
  () => [authStore.profile?.id, authStore.profile?.status],
  async ([profileId, status]) => {
    if (profileId && status === 'active') await vehicleStore.fetchDriverVehicles()
  },
  { immediate: true }
)

watch(localSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => vehicleStore.setSearch(value), 350)
})

function vehicleName(vehicle: any) {
  return `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.unit
}

function countBy(availability: string) {
  return vehicles.value.filter((vehicle) => vehicle.availability === availability).length
}

function availabilityLabel(vehicle: any) {
  return vehicle.assigned_to_me
    ? 'Assigned to you'
    : vehicle.awaiting_manager_review
    ? 'Awaiting manager review'
    : vehicle.locked_by_current_assignment
    ? 'Post-trip required first'
    : vehicle.in_active_repair
    ? 'In repair'
    : vehicle.available
    ? 'Available'
    : 'Unavailable'
}

function availabilityBadge(vehicle: any) {
  return vehicle.assigned_to_me
    ? 'badge-blue'
    : vehicle.awaiting_manager_review
    ? 'badge-yellow'
    : vehicle.in_active_repair
    ? 'badge-orange'
    : vehicle.available
    ? 'badge-green'
    : 'badge-gray'
}

function openDetail(id: string) {
  router.push(`/driver/vehicles/${id}`)
}

async function startPreTrip(vehicle: any) {
  startingId.value = vehicle.id
  const inspectionId = await vehicleStore.startPreTripInspection(vehicle.id)
  startingId.value = ''
  if (inspectionId) router.push(`/inspect/pre?inspectionId=${inspectionId}&vehicleId=${vehicle.id}`)
}

async function startPostTrip(vehicle: any) {
  startingId.value = vehicle.id
  const inspectionId = await vehicleStore.startPostTripInspection(vehicle.id)
  startingId.value = ''
  if (inspectionId) router.push(`/inspect/post?inspectionId=${inspectionId}&vehicleId=${vehicle.id}`)
}

function hideBrokenImage(event: Event) {
  ;(event.target as HTMLImageElement).style.display = 'none'
}
</script>

<style scoped>
.table-th {
  @apply text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap;
}

.table-td {
  @apply px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap;
}

.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30;
}
</style>
