<template>
  <button @click="store.toggleTheme()" class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
    <Moon v-if="store.theme === 'light'" :size="18" />
    <Sun v-else :size="18" />
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
const store = useAppStore()
</script>
