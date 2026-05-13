<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex lg:hidden z-30">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      custom
      v-slot="{ isActive, navigate }"
    >
      <button
        @click="navigate"
        class="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-colors"
        :class="isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'"
      >
        <div v-if="isActive" class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-b-full" />
        <component :is="item.icon" :size="20" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </button>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { LayoutDashboard, ClipboardList, Truck, FileText, User } from 'lucide-vue-next'

const items = [
  { icon: LayoutDashboard, label: 'Home', to: '/dashboard' },
  { icon: ClipboardList, label: 'Inspect', to: '/inspect/pre' },
  { icon: Truck, label: 'Vehicles', to: '/vehicles' },
  { icon: FileText, label: 'Reports', to: '/reports' },
  { icon: User, label: 'Profile', to: '/settings' },
]
</script>
