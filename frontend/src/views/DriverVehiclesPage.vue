<template>
  <AppLayout title="Vehicles">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative w-full sm:flex-1 sm:min-w-48">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          :placeholder="store.t('searchVehicles')"
        />
      </div>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="vehicleStore.availabilityFilter"
          class="input-field py-2 text-sm sm:w-auto"
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
        <div class="px-4 py-3 border-b border-gray-100/80 dark:border-gray-800">
          <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
            Vehicles
          </h2>
        </div>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="table-header-row">
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
                class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
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
                      class="px-2 py-1.5 text-xs whitespace-nowrap"
                      :class="inspectionActionState(vehicle).canStartPreTrip ? 'btn-primary' : 'btn-secondary'"
                      :disabled="!inspectionActionState(vehicle).canStartPreTrip || startingId === vehicle.id"
                      :title="inspectionActionState(vehicle).preTripDisabledReason || 'Start pre-trip inspection'"
                      @click="startPreTrip(vehicle)"
                    >
                      Pre-trip
                    </button>
                    <button
                      class="px-2 py-1.5 text-xs whitespace-nowrap"
                      :class="inspectionActionState(vehicle).canStartPostTrip ? 'btn-primary' : 'btn-secondary'"
                      :disabled="!inspectionActionState(vehicle).canStartPostTrip || startingId === vehicle.id"
                      :title="inspectionActionState(vehicle).postTripDisabledReason || 'Start post-trip inspection'"
                      @click="startPostTrip(vehicle)"
                    >
                      Post-trip
                    </button>
                  </div>
                  <p v-if="inspectionActionHint(vehicle)" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {{ inspectionActionHint(vehicle) }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          <div v-if="vehicles.length === 0" class="px-4 py-12 text-center text-sm text-gray-400">
            No vehicles are available for your license class.
          </div>
          <div
            v-for="vehicle in vehicles"
            :key="vehicle.id"
            class="p-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/45"
            role="button"
            tabindex="0"
            @click="openDetail(vehicle.id)"
          >
            <div class="flex gap-3">
              <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                <img
                  v-if="vehicle.photo_url"
                  :src="vehicle.photo_url"
                  alt=""
                  class="h-full w-full object-cover"
                  @error="hideBrokenImage"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="mobile-card-title truncate">{{ vehicleName(vehicle) }}</p>
                    <p class="mobile-card-meta">
                      {{ [vehicle.unit ? `Unit ${vehicle.unit}` : '', vehicle.plate || ''].filter(Boolean).join(' · ') || '—' }}
                    </p>
                    <p class="mobile-card-meta">{{ vehicle.vehicle_types?.name || '—' }}</p>
                  </div>
                  <span :class="availabilityBadge(vehicle)" class="flex-shrink-0">
                    {{ availabilityLabel(vehicle) }}
                  </span>
                </div>
              </div>
            </div>

            <p v-if="vehicle.odometer != null" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Odometer: {{ Number(vehicle.odometer).toLocaleString() }} mi
            </p>
            <p v-if="inspectionActionHint(vehicle)" class="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
              {{ inspectionActionHint(vehicle) }}
            </p>

            <div class="mobile-action-grid-3 mt-3" @click.stop>
              <button class="mobile-icon-action" title="View vehicle" @click.stop="openDetail(vehicle.id)">
                <Eye :size="15" />
                View
              </button>
              <button
                class="text-sm"
                :class="inspectionActionState(vehicle).canStartPreTrip ? 'btn-primary' : 'btn-secondary'"
                :disabled="!inspectionActionState(vehicle).canStartPreTrip || startingId === vehicle.id"
                :title="inspectionActionState(vehicle).preTripDisabledReason || 'Start pre-trip inspection'"
                @click.stop="startPreTrip(vehicle)"
              >
                Pre-trip
              </button>
              <button
                class="text-sm"
                :class="inspectionActionState(vehicle).canStartPostTrip ? 'btn-primary' : 'btn-secondary'"
                :disabled="!inspectionActionState(vehicle).canStartPostTrip || startingId === vehicle.id"
                :title="inspectionActionState(vehicle).postTripDisabledReason || 'Start post-trip inspection'"
                @click.stop="startPostTrip(vehicle)"
              >
                Post-trip
              </button>
            </div>
          </div>
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
import { isDevDriverPreviewEnabled } from '@/lib/devDriverPreview'

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
    if (isDevDriverPreviewEnabled()) {
      await vehicleStore.fetchDriverVehicles()
      return
    }

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
  if (availability === 'available') return vehicleStore.availableVehicles.length
  return vehicleStore.annotatedVehicles.filter((vehicle) => vehicle.availability === availability).length
}

function availabilityLabel(vehicle: any) {
  return vehicle.status === 'needs-attention' || vehicle.awaiting_manager_review
    ? 'Awaiting manager review'
    : vehicle.assigned_to_me
    ? 'Assigned to you'
    : vehicle.locked_by_current_assignment
    ? 'Post-trip required first'
    : vehicle.in_active_repair
    ? 'In repair'
    : vehicle.available
    ? 'Available'
    : 'Unavailable'
}

function availabilityBadge(vehicle: any) {
  return vehicle.status === 'needs-attention' || vehicle.awaiting_manager_review
    ? 'badge-yellow'
    : vehicle.assigned_to_me
    ? 'badge-blue'
    : vehicle.in_active_repair
    ? 'badge-orange'
    : vehicle.available
    ? 'badge-green'
    : 'badge-gray'
}

function inspectionActionState(vehicle: any) {
  return vehicleStore.getInspectionActionState(vehicle)
}

function inspectionActionHint(vehicle: any) {
  const state = inspectionActionState(vehicle)

  if (state.canStartPostTrip) return state.preTripDisabledReason
  if (vehicle.status === 'needs-attention' || vehicle.awaiting_manager_review) {
    return 'Vehicle is waiting for manager review.'
  }
  if (!state.canStartPreTrip && !state.canStartPostTrip) {
    return state.preTripDisabledReason || state.postTripDisabledReason
  }

  return ''
}

function openDetail(id: string) {
  router.push(`/driver/vehicles/${id}`)
}

async function startPreTrip(vehicle: any) {
  const state = inspectionActionState(vehicle)
  if (!state.canStartPreTrip) {
    vehicleStore.error = state.preTripDisabledReason || 'Pre-trip is not available.'
    return
  }

  startingId.value = vehicle.id
  const inspectionId = await vehicleStore.startPreTripInspection(vehicle.id)
  startingId.value = ''
  if (inspectionId) router.push(`/inspect/pre?inspectionId=${inspectionId}&vehicleId=${vehicle.id}`)
}

async function startPostTrip(vehicle: any) {
  const state = inspectionActionState(vehicle)
  if (!state.canStartPostTrip) {
    vehicleStore.error = state.postTripDisabledReason || 'Post-trip is not available.'
    return
  }

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
  @apply text-left text-[11px] font-medium tracking-normal text-gray-500 dark:text-gray-400 px-4 py-3.5 whitespace-nowrap;
}

.table-td {
  @apply px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap align-middle;
}

.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30;
}
</style>
