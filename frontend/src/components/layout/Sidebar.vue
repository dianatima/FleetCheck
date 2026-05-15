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
    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <!-- Manager section -->
      <div class="space-y-0.5 mb-4">
        <RouterLink
          v-for="item in managerItems"
          :key="item.to"
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
      </div>

      <!-- Driver section separator -->
      <div class="px-2 mb-2 mt-1">
        <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ store.t('driver') }}</p>
      </div>
      <div class="space-y-0.5">
        <RouterLink
          v-for="item in driverItems"
          :key="item.to"
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
      </div>
    </nav>

    <!-- Bottom -->
    <div class="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <RouterLink to="/" class="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium">
        <LogOut :size="15" />
        <span>{{ store.t('signOut') }}</span>
      </RouterLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, Truck, Users, ClipboardList, FileText, Wrench, Settings, ChevronRight, LogOut, User, AlertTriangle } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'

const store = useAppStore()

const managerItems = [
  { icon: LayoutDashboard, label: 'dashboard', to: '/dashboard' },
  { icon: Truck, label: 'vehicles', to: '/vehicles' },
  { icon: Users, label: 'drivers', to: '/drivers' },
  { icon: FileText, label: 'reports', to: '/reports' },
  { icon: AlertTriangle, label: 'issues', to: '/issues' },
  { icon: Wrench, label: 'repairs', to: '/repairs' },
  { icon: Settings, label: 'settings', to: '/settings' },
]

const driverItems = [
  { icon: User, label: 'driverDashboard', to: '/driver' },
  { icon: Truck, label: 'vehicles', to: '/driver/vehicles' },
  { icon: FileText, label: 'reports', to: '/driver/reports' },
  { icon: ClipboardList, label: 'inspections', to: '/inspect/pre' },
]
</script>
