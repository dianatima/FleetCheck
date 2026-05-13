<template>
  <div ref="containerRef" class="relative">
    <button @click="open = !open" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <Globe :size="16" />
      <span v-if="!compact">{{ current?.label }}</span>
      <span v-else>{{ current?.flag }}</span>
    </button>
    <Transition name="fade">
      <div v-if="open" class="absolute right-0 top-full mt-1 w-44 card shadow-lg z-50 py-1">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="select(lang.code)"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="store.language === lang.code ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'"
        >
          <span>{{ lang.flag }}</span>
          <span>{{ lang.label }}</span>
          <span v-if="store.language === lang.code" class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Globe } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
import type { Language } from '../../stores/app'

defineProps<{ compact?: boolean }>()

const store = useAppStore()
const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const languages = [
  { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
  { code: 'uk' as Language, label: 'Українська', flag: '🇺🇦' },
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  { code: 'fr' as Language, label: 'Français', flag: '🇫🇷' },
]

const current = computed(() => languages.find(l => l.code === store.language))

function select(code: Language) {
  store.setLanguage(code)
  open.value = false
}

function onOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
