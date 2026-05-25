<template>
  <div class="table-pagination">
    <p class="text-xs text-gray-500 dark:text-gray-400">
      Showing
      <span class="font-medium text-gray-700 dark:text-gray-200">{{ startItem }}</span>
      –
      <span class="font-medium text-gray-700 dark:text-gray-200">{{ endItem }}</span>
      of
      <span class="font-medium text-gray-700 dark:text-gray-200">{{ total }}</span>
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <select
        :value="pageSize"
        class="input-field py-1.5 text-xs w-auto"
        @change="emitPageSize"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }} / page
        </option>
      </select>

      <button
        class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage <= 1"
        @click="emit('update:currentPage', currentPage - 1)"
      >
        Previous
      </button>

      <span class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200">
        {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage >= totalPages"
        @click="emit('update:currentPage', currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  total: number
  currentPage: number
  pageSize: number
  pageSizeOptions?: number[]
}>(), {
  pageSizeOptions: () => [10, 25, 50, 100],
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize))
)
const startItem = computed(() =>
  props.total === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1
)
const endItem = computed(() =>
  props.total === 0 ? 0 : Math.min(props.currentPage * props.pageSize, props.total)
)

watch(totalPages, (pages) => {
  if (props.currentPage > pages) emit('update:currentPage', pages)
})

function emitPageSize(event: Event) {
  emit('update:pageSize', Number((event.target as HTMLSelectElement).value))
}
</script>

<style scoped>
.table-pagination {
  @apply flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900;
}
</style>
