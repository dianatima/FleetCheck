<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ rule ? "Edit Vehicle Access Rule" : "Create Vehicle Access Rule" }}
            </h2>
            <button
              type="button"
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X :size="18" />
            </button>
          </div>

          <form class="p-6 space-y-5" @submit.prevent="submit">
            <div>
              <label class="label">License Class <span class="text-red-500">*</span></label>
              <input
                v-model.trim="form.license_class"
                class="input-field"
                list="license-class-options"
                placeholder="Class B"
                required
              />
              <datalist id="license-class-options">
                <option v-for="licenseClass in licenseClasses" :key="licenseClass" :value="licenseClass" />
              </datalist>
            </div>

            <div>
              <label class="label">Allowed Vehicle Types <span class="text-red-500">*</span></label>
              <div class="grid sm:grid-cols-2 gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <label
                  v-for="vehicleType in rulesStore.vehicleTypes"
                  :key="vehicleType.id"
                  class="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    v-model="form.vehicle_type_ids"
                    :value="vehicleType.id"
                    type="checkbox"
                    class="h-4 w-4 accent-blue-600"
                  />
                  <span>{{ vehicleType.name }}</span>
                </label>
              </div>
            </div>

            <p v-if="validationError" class="text-sm text-red-500">
              {{ validationError }}
            </p>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" class="btn-secondary px-5 py-2.5" @click="close">
                Cancel
              </button>
              <button type="submit" class="btn-primary px-6 py-2.5" :disabled="loading">
                {{ loading ? "Saving..." : "Save" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import {
  useVehicleAccessRulesStore,
  type VehicleAccessRulePayload,
} from '@/stores/vehicleAccessRulesStore'

const props = defineProps<{
  modelValue: boolean
  rule?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: VehicleAccessRulePayload]
}>()

const rulesStore = useVehicleAccessRulesStore()
const validationError = ref('')
const licenseClasses = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E', 'CDL']
const form = reactive({
  license_class: '',
  vehicle_type_ids: [] as string[],
})

watch(
  () => [props.modelValue, props.rule],
  async () => {
    if (!props.modelValue) return

    form.license_class = props.rule?.license_class || ''
    form.vehicle_type_ids = [...(props.rule?.vehicle_type_ids || [])]
    validationError.value = ''
    await rulesStore.fetchVehicleTypes()
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  const vehicleTypeIds = [...new Set(form.vehicle_type_ids)]

  if (!form.license_class || !vehicleTypeIds.length) {
    validationError.value = 'License class and at least one vehicle type are required.'
    return
  }

  emit('save', {
    license_class: form.license_class,
    vehicle_type_ids: vehicleTypeIds,
  })
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
