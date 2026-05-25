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
import { computed } from 'vue'
import { LayoutDashboard, ClipboardList, Truck, FileText, User } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
import { useAuthStore } from '@/stores/authStore'

const store = useAppStore()
const authStore = useAuthStore()

const items = computed(() =>
  authStore.role === 'driver'
    ? [
        { icon: LayoutDashboard, label: store.t('home'), to: '/driver' },
        { icon: Truck, label: store.t('myVehicles'), to: '/driver/vehicles' },
        { icon: ClipboardList, label: store.t('inspect'), to: '/inspect/pre' },
        { icon: FileText, label: store.t('reports'), to: '/driver/reports' },
        { icon: User, label: store.t('profile'), to: '/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: store.t('home'), to: '/dashboard' },
        { icon: ClipboardList, label: store.t('inspect'), to: '/inspect/pre' },
        { icon: Truck, label: store.t('vehicles'), to: '/vehicles' },
        { icon: FileText, label: store.t('reports'), to: '/reports' },
        { icon: User, label: store.t('profile'), to: '/settings' },
      ]
)
</script>
