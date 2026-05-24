<template>
  <AppLayout :title="store.t('startInspection')">
    <div class="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ store.t('chooseVehicleAndAction') }}</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ store.t('chooseVehicleAndActionHint') }}
        </p>
      </div>

      <div v-if="launcherError" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
        {{ launcherError }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section class="card p-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Vehicle</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('onlyBusinessScopedVehicles') }}</p>
            </div>
            <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-300">{{ vehicleOptions.length }} {{ store.t('availableCountLabel') }}</span>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label">{{ store.t('chooseByUnitOrPlate') }}</label>
              <select v-model="selectedVehicleId" class="input-field" :disabled="loadingVehicles || vehicleOptions.length === 0">
                <option value="" disabled>{{ loadingVehicles ? store.t('loadingVehicles') : store.t('selectVehicle') }}</option>
                <option v-for="vehicle in vehicleOptions" :key="vehicle.id" :value="vehicle.id">{{ formatVehicleOption(vehicle) }}</option>
              </select>
            </div>

            <div v-if="selectedVehicle" class="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <Truck :size="22" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ selectedVehicle.make }} {{ selectedVehicle.model }}</p>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ store.t('vehicleNumber') }} #{{ selectedVehicle.unit }}<span v-if="selectedVehicle.plate"> · {{ selectedVehicle.plate }}</span></p>
                  <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span class="badge-blue">{{ getVehicleTypeLabel(selectedVehicle.type, store.language) }}</span>
                    <span class="badge-gray">{{ vehicleStatusConfig[selectedVehicle.status]?.label || selectedVehicle.status }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
              {{ store.t('selectVehicleForActions') }}
            </div>
          </div>
        </section>

        <section class="card p-5">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ store.t('actionLabel') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ store.t('actionLinkedToVehicle') }}</p>
          </div>

          <div class="space-y-3">
            <button type="button" class="flex w-full items-center gap-4 rounded-2xl bg-blue-600 p-4 text-left text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedVehicle" @click="startAction('pre-trip')">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500"><ClipboardCheck :size="22" /></div>
              <div class="flex-1">
                <p class="font-semibold">{{ store.t('preTripInspection') }}</p>
                <p class="text-xs text-blue-100">{{ store.t('matchedPreTripTemplate') }}</p>
              </div>
              <ChevronRight :size="18" class="text-blue-200" />
            </button>

            <button type="button" class="flex w-full items-center gap-4 rounded-2xl bg-green-600 p-4 text-left text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedVehicle" @click="startAction('post-trip')">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500"><ClipboardCheck :size="22" /></div>
              <div class="flex-1">
                <p class="font-semibold">{{ store.t('postTripInspection') }}</p>
                <p class="text-xs text-green-100">{{ store.t('matchedPostTripTemplate') }}</p>
              </div>
              <ChevronRight :size="18" class="text-green-200" />
            </button>

            <button type="button" class="flex w-full items-center gap-4 rounded-2xl bg-orange-600 p-4 text-left text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedVehicle" @click="startAction('repair')">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500"><Wrench :size="22" /></div>
              <div class="flex-1">
                <p class="font-semibold">{{ store.t('repairRequests') }}</p>
                <p class="text-xs text-orange-100">{{ store.t('openRepairRequestForVehicle') }}</p>
              </div>
              <ChevronRight :size="18" class="text-orange-200" />
            </button>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, ClipboardCheck, Truck, Wrench } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { fetchCompanyVehicles, type CompanyVehicle } from '@/lib/companyVehicles'
import { getVehicleTypeLabel } from '@/lib/vehicleCatalog'

type WorkflowAction = 'pre-trip' | 'post-trip' | 'repair'

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const loadingVehicles = ref(false)
const launcherError = ref('')
const vehicleOptions = ref<CompanyVehicle[]>([])
const selectedVehicleId = ref('')

const selectedVehicle = computed(() => vehicleOptions.value.find((vehicle) => vehicle.id === selectedVehicleId.value) || null)
const vehicleStatusConfig = computed<Record<string, { label: string }>>(() => ({
  active: { label: store.t('statusActive') },
  'needs-attention': { label: store.t('statusNeedsAttention') },
  blocked: { label: store.t('statusBlocked') },
  'in-repair': { label: store.t('statusInRepair') },
}))

function formatVehicleOption(vehicle: CompanyVehicle) {
  const parts = [`#${vehicle.unit}`]

  if (vehicle.plate) {
    parts.push(vehicle.plate)
  }

  const label = `${vehicle.make || ''} ${vehicle.model || ''}`.trim()

  if (label) {
    parts.push(label)
  }

  return parts.join(' · ')
}

async function loadVehicles() {
  launcherError.value = ''

  if (!authStore.companyId) {
    vehicleOptions.value = []
    selectedVehicleId.value = ''
    return
  }

  loadingVehicles.value = true

  try {
    vehicleOptions.value = await fetchCompanyVehicles(authStore.companyId, authStore.role === 'driver'
      ? { assignedToAuthUserId: authStore.user?.id || null }
      : {})
    selectedVehicleId.value = vehicleOptions.value[0]?.id || ''
  } catch (error: any) {
    launcherError.value = error?.message || store.t('unableToLoadVehicles')
    vehicleOptions.value = []
    selectedVehicleId.value = ''
  } finally {
    loadingVehicles.value = false
  }
}

function startAction(action: WorkflowAction) {
  if (!selectedVehicle.value) {
    launcherError.value = store.t('selectVehicleFirst')
    return
  }

  if (action === 'repair') {
    router.push({ path: '/repairs', query: { create: '1', vehicleId: selectedVehicle.value.id } })
    return
  }

  router.push({ path: action === 'pre-trip' ? '/inspect/pre' : '/inspect/post', query: { vehicleId: selectedVehicle.value.id } })
}

onMounted(loadVehicles)
watch(() => authStore.companyId, loadVehicles)
</script>