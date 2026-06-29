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
      <div v-if="showManagerNav" class="space-y-0.5 mb-4">
        <RouterLink
          v-for="item in managerItems"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, navigate }"
        >
          <button @click="navigate" :class="isNavActive(item.to, isActive) ? 'sidebar-link-active' : 'sidebar-link'" class="w-full">
            <component :is="item.icon" :size="18" />
            <span>{{ store.t(item.label) }}</span>
            <ChevronRight v-if="isNavActive(item.to, isActive)" :size="14" class="ml-auto" />
          </button>
        </RouterLink>
      </div>

      <div v-if="showDriverNav" class="space-y-0.5">
        <RouterLink
          v-for="item in driverItems"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, navigate }"
        >
          <button @click="navigate" :class="isNavActive(item.to, isActive) ? 'sidebar-link-active' : 'sidebar-link'" class="w-full">
            <component :is="item.icon" :size="18" />
            <span>{{ store.t(item.label) }}</span>
            <ChevronRight v-if="isNavActive(item.to, isActive)" :size="14" class="ml-auto" />
          </button>
        </RouterLink>
      </div>
    </nav>

    <!-- Bottom -->
    <div class="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <button
        type="button"
        class="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
        @click="handleLogout"
      >
        <LogOut :size="15" />
        <span>{{ store.t('signOut') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, Truck, Users, FileText, Wrench, Settings, ChevronRight, LogOut, User, AlertTriangle } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { useAuthStore } from '@/stores/authStore'
import { computed } from 'vue'

const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const showDriverNav = computed(() => authStore.role === 'driver')
const showManagerNav = computed(() => authStore.role !== 'driver')

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
]

function isNavActive(path: string, routerIsActive: boolean) {
  if (route.path === path) return true
  if (path === '/driver') return route.path === '/driver'
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(`${path}/`) || routerIsActive
}

async function handleLogout() {
  await authStore.logout()
  router.replace('/login')
}

</script>
