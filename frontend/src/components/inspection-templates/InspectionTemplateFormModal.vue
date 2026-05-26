<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ template ? "Edit Inspection Template" : "Create Inspection Template" }}
            </h2>
            <button
              type="button"
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X :size="18" />
            </button>
          </div>

          <form class="p-6 space-y-5" @submit.prevent="submitForm">
            <div>
              <label class="label">Template name <span class="text-red-500">*</span></label>
              <input
                v-model.trim="form.name"
                class="input-field"
                placeholder="Pre-trip truck inspection"
                required
              />
            </div>

            <div>
              <label class="label">Description</label>
              <textarea
                v-model="form.description"
                class="input-field resize-none"
                rows="3"
                placeholder="Describe when this template should be used."
              />
            </div>

            <div>
              <label class="label">Vehicle type <span class="text-red-500">*</span></label>
              <select
                v-model="form.vehicle_type_id"
                class="input-field"
                :disabled="vehicleTypes.length === 0"
                required
              >
                <option value="" disabled>Select vehicle type</option>
                <option
                  v-for="vehicleType in vehicleTypes"
                  :key="vehicleType.id"
                  :value="vehicleType.id"
                >
                  {{ vehicleType.name }}
                </option>
              </select>
              <p
                v-if="!template && vehicleTypes.length === 0"
                class="mt-2 text-sm text-gray-500 dark:text-gray-400"
              >
                All vehicle types already have inspection templates.
              </p>
            </div>

            <p v-if="formError" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500 dark:bg-red-900/20 dark:text-red-400">
              {{ formError }}
            </p>

            <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" class="btn-secondary px-5 py-2.5" @click="close">
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary px-6 py-2.5 gap-2"
                :disabled="loading || (!template && vehicleTypes.length === 0)"
              >
                <Save :size="16" />
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
import { computed, reactive, ref, watch } from 'vue'
import { Save, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  template?: any | null
  vehicleTypes: Array<{ id: string; name: string }>
  error?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: {
    name: string
    description: string | null
    vehicle_type_id: string
    is_default: boolean
  }]
}>()

const validationError = ref('')
const formError = computed(() => validationError.value || props.error || '')
const form = reactive({
  name: '',
  description: '',
  vehicle_type_id: '',
  is_default: false,
})

watch(
  () => [props.modelValue, props.template],
  async () => {
    if (!props.modelValue) return

    Object.assign(form, {
      name: props.template?.name || '',
      description: props.template?.description || '',
      vehicle_type_id: props.template?.vehicle_type_id || '',
      is_default: true,
    })
    validationError.value = ''
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

function submitForm() {
  if (!form.name || !form.vehicle_type_id) {
    validationError.value = 'Template name and vehicle type are required.'
    return
  }

  emit('save', {
    name: form.name,
    description: form.description.trim() || null,
    vehicle_type_id: form.vehicle_type_id,
    is_default: true,
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
