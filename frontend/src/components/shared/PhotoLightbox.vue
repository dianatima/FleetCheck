<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
      role="dialog"
      aria-modal="true"
      @click.self="close"
    >
      <button
        type="button"
        class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Close photo preview"
        @click="close"
      >
        <X :size="22" />
      </button>

      <button
        v-if="photos.length > 1"
        type="button"
        class="nav-button left-4"
        aria-label="Previous photo"
        @click.stop="previous"
      >
        <ChevronLeft :size="28" />
      </button>

      <div class="flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-3">
        <div class="flex max-h-[82vh] w-full items-center justify-center">
          <img
            v-if="currentPhoto && !loadFailed"
            :src="currentPhoto"
            alt=""
            class="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl"
            @error="loadFailed = true"
          />
          <div
            v-else
            class="rounded-2xl bg-white px-6 py-5 text-sm font-medium text-gray-600 shadow-2xl dark:bg-gray-900 dark:text-gray-300"
          >
            Photo could not be loaded.
          </div>
        </div>

        <p v-if="photos.length > 1" class="text-xs font-medium text-white/70">
          {{ activeIndex + 1 }} / {{ photos.length }}
        </p>
      </div>

      <button
        v-if="photos.length > 1"
        type="button"
        class="nav-button right-4"
        aria-label="Next photo"
        @click.stop="next"
      >
        <ChevronRight :size="28" />
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  photos: string[]
  startIndex?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const activeIndex = ref(0)
const loadFailed = ref(false)

const currentPhoto = computed(() => props.photos[activeIndex.value] || '')

watch(
  () => [props.modelValue, props.startIndex, props.photos.length] as const,
  ([isOpen, startIndex]) => {
    if (!isOpen) return
    activeIndex.value = clampIndex(Number(startIndex || 0))
    loadFailed.value = false
  }
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) window.addEventListener('keydown', handleKeydown)
    else window.removeEventListener('keydown', handleKeydown)
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function close() {
  emit('update:modelValue', false)
}

function previous() {
  activeIndex.value =
    activeIndex.value <= 0 ? props.photos.length - 1 : activeIndex.value - 1
  loadFailed.value = false
}

function next() {
  activeIndex.value =
    activeIndex.value >= props.photos.length - 1 ? 0 : activeIndex.value + 1
  loadFailed.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.modelValue) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowLeft' && props.photos.length > 1) previous()
  if (event.key === 'ArrowRight' && props.photos.length > 1) next()
}

function clampIndex(index: number) {
  if (!props.photos.length) return 0
  if (index < 0) return 0
  if (index >= props.photos.length) return props.photos.length - 1
  return index
}
</script>

<style scoped>
.nav-button {
  @apply absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:flex;
}
</style>
