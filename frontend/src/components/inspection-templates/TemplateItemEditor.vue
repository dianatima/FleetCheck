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
          <label class="label">Item title <span class="text-red-500">*</span></label>
          <input
            :value="item.title"
            class="input-field"
            placeholder="Check service brakes"
            @input="patch({ title: inputValue($event) })"
          />
        </div>
        <div>
          <label class="label">Category</label>
          <input
            :value="item.category || ''"
            class="input-field"
            placeholder="Brakes"
            @input="patch({ category: inputValue($event) || null })"
          />
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="icon-btn"
          title="Move up"
          :disabled="index === 0"
          @click="emit('move', index, index - 1)"
        >
          <ArrowUp :size="15" />
        </button>
        <button
          type="button"
          class="icon-btn"
          title="Move down"
          :disabled="index === count - 1"
          @click="emit('move', index, index + 1)"
        >
          <ArrowDown :size="15" />
        </button>
        <button
          type="button"
          class="icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          title="Remove item"
          @click="emit('remove', index)"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </div>

    <div class="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <label class="label">Description</label>
        <textarea
          :value="item.description || ''"
          class="input-field resize-none"
          rows="2"
          placeholder="Driver instructions for this check."
          @input="patch({ description: inputValue($event) || null })"
        />
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-1 gap-2 self-start min-w-44">
        <label class="option-row">
          <input
            :checked="item.is_required"
            type="checkbox"
            class="h-4 w-4 accent-blue-600"
            @change="patch({ is_required: checkedValue($event) })"
          />
          Required
        </label>
        <label class="option-row">
          <input
            :checked="item.requires_photo"
            type="checkbox"
            class="h-4 w-4 accent-blue-600"
            @change="patch({ requires_photo: checkedValue($event) })"
          />
          Requires photo
        </label>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-vue-next'
import type { TemplateItemDraft } from '@/stores/inspectionTemplateStore'

const props = defineProps<{
  item: TemplateItemDraft
  index: number
  count: number
}>()

const emit = defineEmits<{
  update: [index: number, patch: Partial<TemplateItemDraft>]
  remove: [index: number]
  move: [from: number, to: number]
  'drag-start': [index: number]
  'drop-on': [index: number]
}>()

function patch(update: Partial<TemplateItemDraft>) {
  emit('update', props.index, update)
}

function inputValue(event: Event) {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function checkedValue(event: Event) {
  return (event.target as HTMLInputElement).checked
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
