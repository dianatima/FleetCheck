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
              {{ category ? 'Edit Category' : 'Add Category' }}
            </h2>
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="close"
            >
              <X :size="18" />
            </button>
          </div>

          <form class="p-6 space-y-5" @submit.prevent="submit">
            <div>
              <label class="label">Name <span class="text-red-500">*</span></label>
              <input
                v-model.trim="form.name"
                class="input-field"
                placeholder="Brakes"
                required
              />
            </div>

            <div>
              <label class="label">Severity <span class="text-red-500">*</span></label>
              <select v-model="form.severity" class="input-field" required>
                <option value="" disabled>Select severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label class="label">Sort Order</label>
              <input
                v-model.number="form.sort_order"
                class="input-field"
                type="number"
                min="0"
                step="1"
                placeholder="0"
              />
            </div>

            <p v-if="validationError" class="text-sm text-red-500">
              {{ validationError }}
            </p>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button type="button" class="btn-secondary px-5 py-2.5" @click="close">
                Cancel
              </button>
              <button type="submit" class="btn-primary px-6 py-2.5 gap-2" :disabled="loading">
                <Save :size="16" />
                {{ loading ? 'Saving...' : 'Save' }}
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
import { Save, X } from 'lucide-vue-next'
import type {
  InspectionItemCategory,
  InspectionItemCategoryPayload,
  InspectionItemCategorySeverity,
} from '@/stores/inspectionItemCategoryStore'

const props = defineProps<{
  modelValue: boolean
  category?: InspectionItemCategory | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: InspectionItemCategoryPayload]
}>()

const validationError = ref('')
const form = reactive({
  name: '',
  severity: '' as InspectionItemCategorySeverity | '',
  sort_order: 0,
})

watch(
  () => [props.modelValue, props.category],
  () => {
    if (!props.modelValue) return

    form.name = props.category?.name || ''
    form.severity = props.category?.severity || ''
    form.sort_order = Number(props.category?.sort_order || 0)
    validationError.value = ''
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

function submit() {
  if (!form.name.trim() || !form.severity) {
    validationError.value = 'Name and severity are required.'
    return
  }

  emit('save', {
    name: form.name,
    severity: form.severity,
    sort_order: Number(form.sort_order || 0),
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
