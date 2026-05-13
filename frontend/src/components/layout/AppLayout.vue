<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
    <Sidebar />

    <!-- Top bar -->
    <header class="fixed top-0 left-0 lg:left-56 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sm:px-6 gap-3 z-20">
      <button class="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
        <Menu :size="20" />
      </button>
      <h1 class="font-semibold text-gray-900 dark:text-white flex-1 truncate">{{ title }}</h1>
      <div class="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
        <div class="relative flex-1">
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input class="input-field pl-9 py-1.5 text-sm" placeholder="Search..." />
        </div>
      </div>
      <div class="flex items-center gap-1">
        <NotificationBell />
        <LanguageSelector :compact="true" />
        <ThemeToggle />
      </div>
    </header>

    <!-- Main content -->
    <main class="pt-16 lg:pl-56 pb-20 lg:pb-6">
      <div class="px-4 sm:px-6 py-5">
        <slot />
      </div>
    </main>

    <MobileNav />
  </div>
</template>

<script setup lang="ts">
import { Menu, Search } from 'lucide-vue-next'
import Sidebar from './Sidebar.vue'
import MobileNav from './MobileNav.vue'
import ThemeToggle from '../shared/ThemeToggle.vue'
import LanguageSelector from '../shared/LanguageSelector.vue'
import NotificationBell from '../shared/NotificationBell.vue'

defineProps<{ title: string }>()
</script>
