<template>
  <AppLayout title="Vehicle Details">
    <RouterLink to="/driver/vehicles" class="back-link">
      <ArrowLeft :size="16" />
      Back to Vehicles
    </RouterLink>

    <div v-if="vehicleStore.loading" class="card p-6 text-sm text-gray-500">
      Loading vehicle...
    </div>
    <div v-else-if="vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ vehicleStore.error }}
    </div>
    <div v-else-if="!vehicle" class="card p-6 text-sm text-gray-500">
      Vehicle is not available.
    </div>
    <template v-else>
      <section class="card overflow-hidden mb-5">
        <div class="h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          <img v-if="vehicle.photo_url" :src="vehicle.photo_url" :alt="vehicleName" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <Camera :size="44" />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div class="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-xl font-bold text-white">{{ vehicleName }}</h2>
              <p class="text-white/80 text-sm">Unit {{ vehicle.unit }} · {{ vehicle.vehicle_types?.name }}</p>
            </div>
            <span :class="availabilityBadge">{{ availabilityLabel }}</span>
          </div>
        </div>

        <div class="p-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700">
          <p
            v-if="vehicle.locked_by_current_assignment"
            class="w-full text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2"
          >
            Complete post-trip inspection for your assigned vehicle first.
          </p>
          <p
            v-if="vehicle.awaiting_manager_review"
            class="w-full text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg px-3 py-2"
          >
            Awaiting manager review. Manager review required before post-trip.
          </p>
          <button
            class="w-full gap-2 text-sm sm:w-auto"
            :class="actionState.canStartPreTrip ? 'btn-primary' : 'btn-secondary'"
            :disabled="!actionState.canStartPreTrip || starting"
            :title="actionState.preTripDisabledReason || 'Start pre-trip inspection'"
            @click="startPreTrip"
          >
            <ClipboardCheck :size="15" />
            Start Pre-trip Inspection
          </button>
          <button
            class="w-full gap-2 text-sm sm:w-auto"
            :class="actionState.canStartPostTrip ? 'btn-primary' : 'btn-secondary'"
            :disabled="!actionState.canStartPostTrip || starting"
            :title="actionState.postTripDisabledReason || 'Start post-trip inspection'"
            @click="startPostTrip"
          >
            <ClipboardList :size="15" />
            Start Post-trip Inspection
          </button>
          <p v-if="actionHint" class="w-full text-xs text-gray-500 dark:text-gray-400">
            {{ actionHint }}
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="detail in details" :key="detail.label" class="detail-row">
            <component :is="detail.icon" :size="15" class="text-gray-500 dark:text-gray-400" />
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ detail.label }}</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ detail.value }}</p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, ClipboardCheck, ClipboardList, Fuel, Gauge, Hash, MapPin } from 'lucide-vue-next'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/authStore'
import { useDriverVehicleStore } from '@/stores/driverVehicleStore'

const authStore = useAuthStore()
const vehicleStore = useDriverVehicleStore()
const route = useRoute()
const router = useRouter()
const starting = ref(false)
const vehicleId = computed(() => route.params.id as string)
const vehicle = computed(() => vehicleStore.selectedVehicle)
const vehicleName = computed(() =>
  `${vehicle.value?.make || ''} ${vehicle.value?.model || ''}`.trim() || vehicle.value?.unit || ''
)

watch(
  () => [authStore.profile?.id, vehicleId.value],
  async ([profileId]) => {
    if (profileId) await vehicleStore.fetchDriverVehicleById(vehicleId.value)
  },
  { immediate: true }
)

const availabilityLabel = computed(() => {
  if (!vehicle.value) return ''
  if (vehicle.value.status === 'needs-attention' || vehicle.value.awaiting_manager_review) return 'Awaiting manager review'
  if (vehicle.value.assigned_to_me) return 'Assigned to you'
  if (vehicle.value.in_active_repair) return 'In repair'
  return vehicle.value.available ? 'Available' : 'Unavailable'
})
const availabilityBadge = computed(() => {
  if (vehicle.value?.status === 'needs-attention' || vehicle.value?.awaiting_manager_review) return 'badge-yellow'
  if (vehicle.value?.assigned_to_me) return 'badge-blue'
  if (vehicle.value?.in_active_repair) return 'badge-orange'
  return vehicle.value?.available ? 'badge-green' : 'badge-gray'
})
const actionState = computed(() => vehicleStore.getInspectionActionState(vehicle.value))
const actionHint = computed(() => {
  if (!vehicle.value) return ''
  if (actionState.value.canStartPostTrip) return actionState.value.preTripDisabledReason
  if (vehicle.value.status === 'needs-attention' || vehicle.value.awaiting_manager_review) {
    return 'Vehicle is waiting for manager review.'
  }
  if (!actionState.value.canStartPreTrip && !actionState.value.canStartPostTrip) {
    return actionState.value.preTripDisabledReason || actionState.value.postTripDisabledReason
  }

  return ''
})
const details = computed(() => [
  { icon: Hash, label: 'Unit', value: vehicle.value?.unit || '—' },
  { icon: MapPin, label: 'Plate', value: vehicle.value?.plate || '—' },
  { icon: Hash, label: 'Vehicle type', value: vehicle.value?.vehicle_types?.name || '—' },
  {
    icon: Gauge,
    label: 'Odometer',
    value: vehicle.value?.odometer != null ? `${Number(vehicle.value.odometer).toLocaleString()} mi` : '—',
  },
  {
    icon: Fuel,
    label: 'Engine hours',
    value: vehicle.value?.engine_hours != null ? `${Number(vehicle.value.engine_hours).toLocaleString()} hrs` : '—',
  },
])

async function startPreTrip() {
  if (!vehicle.value) return
  if (!actionState.value.canStartPreTrip) {
    vehicleStore.error = actionState.value.preTripDisabledReason || 'Pre-trip is not available.'
    return
  }

  starting.value = true
  const inspectionId = await vehicleStore.startPreTripInspection(vehicle.value.id)
  starting.value = false
  if (inspectionId) router.push(`/inspect/pre?inspectionId=${inspectionId}&vehicleId=${vehicle.value.id}`)
}

async function startPostTrip() {
  if (!vehicle.value) return
  if (!actionState.value.canStartPostTrip) {
    vehicleStore.error = actionState.value.postTripDisabledReason || 'Post-trip is not available.'
    return
  }

  starting.value = true
  const inspectionId = await vehicleStore.startPostTripInspection(vehicle.value.id)
  starting.value = false
  if (inspectionId) router.push(`/inspect/post?inspectionId=${inspectionId}&vehicleId=${vehicle.value.id}`)
}
</script>

<style scoped>
.back-link {
  @apply flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors;
}

.detail-row {
  @apply flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-700;
}
</style>
