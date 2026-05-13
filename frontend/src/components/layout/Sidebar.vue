<template>
  <aside class="fixed left-0 top-0 h-screen w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col z-30 hidden lg:flex">
    <!-- Logo -->
    <div class="h-16 flex items-center gap-2.5 px-4 border-b border-gray-100 dark:border-gray-800">
      <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Truck :size="16" class="text-white" />
      </div>
      <div>
        <div class="font-bold text-gray-900 dark:text-white text-sm leading-tight">FleetCheck</div>
        <div class="text-[10px] text-blue-500 font-semibold">PRO</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        custom
        v-slot="{ isActive, navigate }"
      >
        <button @click="navigate" :class="isActive ? 'sidebar-link-active' : 'sidebar-link'" class="w-full">
          <component :is="item.icon" :size="18" />
          <span>{{ store.t(item.label) }}</span>
          <ChevronRight v-if="isActive" :size="14" class="ml-auto" />
        </button>
      </RouterLink>
    </nav>

    <!-- Bottom -->
    <div class="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <div class="flex items-center gap-2 px-2">
        <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">JD</div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-gray-900 dark:text-white truncate">James Davis</p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">Fleet Manager</p>
        </div>
      </div>
      <div class="flex items-center gap-1 pt-1">
        <NotificationBell />
        <LanguageSelector :compact="true" />
        <ThemeToggle />
        <RouterLink to="/" class="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <LogOut :size="15" />
        </RouterLink>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, Truck, Users, ClipboardList, FileText, Wrench, Settings, ChevronRight, LogOut } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
import NotificationBell from '../shared/NotificationBell.vue'
import LanguageSelector from '../shared/LanguageSelector.vue'
import ThemeToggle from '../shared/ThemeToggle.vue'

const store = useAppStore()

const navItems = [
  { icon: LayoutDashboard, label: 'dashboard', to: '/dashboard' },
  { icon: Truck, label: 'vehicles', to: '/vehicles' },
  { icon: Users, label: 'drivers', to: '/vehicles' },
  { icon: ClipboardList, label: 'inspections', to: '/inspect/pre' },
  { icon: FileText, label: 'reports', to: '/reports' },
  { icon: Wrench, label: 'repairs', to: '/repairs' },
  { icon: Settings, label: 'settings', to: '/settings' },
]
</script>
