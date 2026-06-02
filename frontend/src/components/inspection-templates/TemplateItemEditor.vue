<template>
  <article
    class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
    draggable="true"
    @dragstart="emit('drag-start', index)"
    @dragover.prevent
    @drop.prevent="emit('drop-on', index)"
  >
    <div class="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
      <div class="flex flex-col items-center gap-1 pt-1 text-gray-400">
        <GripVertical :size="16" />
        <span class="text-[11px] font-semibold">{{ item.sort_order }}</span>
      </div>

      <div class="grid sm:grid-cols-2 gap-3 flex-1 min-w-0">
        <div>
          <label class="label">{{ store.t('itemTitle') }} <span class="text-red-500">*</span></label>
          <input
            :value="item.title"
            class="input-field"
            :placeholder="store.t('checklistItemPlaceholder')"
            @input="patch({ title: inputValue($event) })"
          />
        </div>
        <div>
          <label class="label">{{ store.t('category') }} <span class="text-red-500">*</span></label>
          <input
            v-if="!categories.length"
            value=""
            class="input-field"
            :placeholder="store.t('createTemplateCategoriesFirst')"
            disabled
          />
          <select
            v-else
            :value="item.category_id"
            class="input-field"
            required
            @change="patch({ category_id: inputValue($event) })"
          >
            <option value="" disabled>{{ store.t('selectCategory') }}</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <p v-if="selectedCategory" class="mt-1">
            <span :class="severityBadge(selectedCategory.severity)">
              {{ severityLabel(selectedCategory.severity) }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="icon-btn"
          :title="store.t('moveUp')"
          :disabled="index === 0"
          @click="emit('move', index, index - 1)"
        >
          <ArrowUp :size="15" />
        </button>
        <button
          type="button"
          class="icon-btn"
          :title="store.t('moveDown')"
          :disabled="index === count - 1"
          @click="emit('move', index, index + 1)"
        >
          <ArrowDown :size="15" />
        </button>
        <button
          type="button"
          class="icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          :title="store.t('removeItem')"
          @click="emit('remove', index)"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <div class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <label class="label">{{ store.t('description') }}</label>
        <textarea
          :value="item.description || ''"
          class="input-field resize-none"
          rows="2"
          :placeholder="store.t('driverInstructionsPlaceholder')"
          @input="patch({ description: inputValue($event) || null })"
        />

        <div class="mt-3">
          <div class="flex flex-wrap items-center gap-2">
            <label class="option-row cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="uploadingReference"
                @change="uploadReferencePhoto"
              />
              <span>{{ uploadingReference ? store.t('uploading') : store.t('uploadReferencePhoto') }}</span>
            </label>
            <button
              v-if="item.reference_photo_url"
              type="button"
              class="text-xs text-red-600 hover:underline"
              @click="patch({ reference_photo_url: null })"
            >
              {{ store.t('removePhoto') }}
            </button>
          </div>
          <p v-if="uploadError" class="mt-1 text-xs text-red-500">{{ uploadError }}</p>
          <div v-if="item.reference_photo_url" class="mt-2">
            <img :src="item.reference_photo_url" :alt="store.t('referencePhoto')" class="h-24 w-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
          </div>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-1 gap-2 self-start min-w-44">
        <label class="option-row">
          <input
            :checked="item.is_required"
            type="checkbox"
            class="h-4 w-4 accent-blue-600"
            @change="patch({ is_required: checkedValue($event) })"
          />
          {{ store.t('requiredLabel') }}
        </label>
        <label class="option-row">
          <input
            :checked="item.requires_photo"
            type="checkbox"
            class="h-4 w-4 accent-blue-600"
            @change="patch({ requires_photo: checkedValue($event) })"
          />
          {{ store.t('requiresPhotoLabel') }}
        </label>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-vue-next'
import type { TemplateItemDraft } from '@/stores/inspectionTemplateStore'
import { uploadTemplateReferencePhoto } from '@/api/storage'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  item: TemplateItemDraft
  index: number
  count: number
  categories: Array<{ id: string; name: string; severity: 'low' | 'medium' | 'high' }>
}>()

const emit = defineEmits<{
  update: [index: number, patch: Partial<TemplateItemDraft>]
  remove: [index: number]
  move: [from: number, to: number]
  'drag-start': [index: number]
  'drop-on': [index: number]
}>()

const uploadingReference = ref(false)
const uploadError = ref('')
const store = useAppStore()

function patch(update: Partial<TemplateItemDraft>) {
  emit('update', props.index, update)
}

function inputValue(event: Event) {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function checkedValue(event: Event) {
  return (event.target as HTMLInputElement).checked
}

async function uploadReferencePhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadError.value = ''
  uploadingReference.value = true

  try {
    const url = await uploadTemplateReferencePhoto(file)
    patch({ reference_photo_url: url })
  } catch (error: any) {
    uploadError.value = error?.message || store.t('referencePhotoUploadFailed')
  } finally {
    uploadingReference.value = false
    input.value = ''
  }
}

const selectedCategory = computed(() =>
  props.categories.find((category) => category.id === props.item.category_id)
)

function severityLabel(severity: string) {
  return {
    low: store.t('priorityLow'),
    medium: store.t('priorityMedium'),
    high: store.t('priorityHigh'),
  }[severity] || store.t('priorityMedium')
}

function severityBadge(severity: string) {
  return {
    low: 'badge-green',
    medium: 'badge-orange',
    high: 'badge-red',
  }[severity] || 'badge-orange'
}
</script>

<style scoped>
.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200;
}

.option-row {
  @apply flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200;
}
</style>
