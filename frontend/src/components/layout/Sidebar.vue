<template>
  <div v-if="props.mobileOpen" class="fixed inset-0 z-20 bg-black/40 backdrop-blur-[1px] lg:hidden" @click="emit('close')" />

  <aside
    :class="[
      props.mobileOpen ? 'flex' : 'hidden',
      'fixed left-0 top-0 h-screen w-72 max-w-[85vw] lg:w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col z-30 lg:flex',
    ]"
  >
    <!-- Logo -->
    <div class="h-16 flex items-center justify-between gap-2.5 px-4 border-b border-gray-100 dark:border-gray-800">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Truck :size="16" class="text-white" />
        </div>
        <div>
          <div class="font-bold text-gray-900 dark:text-white text-sm leading-tight">FleetCheck</div>
          <div class="text-[10px] text-blue-500 font-semibold">PRO</div>
        </div>
      </div>
      <button
        type="button"
        class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        :aria-label="store.t('closeMenu')"
        @click="emit('close')"
      >
        <X :size="18" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <!-- Manager section -->
      <div v-if="authStore.role !== 'driver'" class="space-y-0.5 mb-4">
        <RouterLink
          v-for="item in managerItems"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, navigate }"
        >
          <button @click="handleNavigate(navigate)" :class="isActive ? 'sidebar-link-active' : 'sidebar-link'" class="w-full">
            <component :is="item.icon" :size="18" />
            <span>{{ store.t(item.label) }}</span>
            <ChevronRight v-if="isActive" :size="14" class="ml-auto" />
          </button>
        </RouterLink>
      </div>

      <!-- Driver section separator -->
      <div v-if="authStore.role === 'driver'" class="px-2 mb-2 mt-1">
        <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{{ store.t('driver') }}</p>
      </div>
      <div v-if="authStore.role === 'driver'" class="space-y-0.5">
        <RouterLink
          v-for="item in driverItems"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ isActive, navigate }"
        >
          <button @click="handleNavigate(navigate)" :class="isActive ? 'sidebar-link-active' : 'sidebar-link'" class="w-full">
            <component :is="item.icon" :size="18" />
            <span>{{ store.t(item.label) }}</span>
            <ChevronRight v-if="isActive" :size="14" class="ml-auto" />
          </button>
        </RouterLink>
      </div>
    </nav>

    <!-- Bottom -->
    <div class="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <button
        type="button"
        @click="handleSignOut"
        class="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
      >
        <LogOut :size="15" />
        <span>{{ store.t('signOut') }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { LayoutDashboard, Truck, Users, ClipboardList, FileText, Wrench, Settings, ChevronRight, LogOut, User, AlertTriangle, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAppStore } from '../../stores/app'
import { useAuthStore } from '../../stores/authStore'

const props = withDefaults(defineProps<{ mobileOpen?: boolean }>(), {
  mobileOpen: false,
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const managerItems = [
  { icon: LayoutDashboard, label: 'dashboard', to: '/dashboard' },
  { icon: ClipboardList, label: 'inspections', to: '/operations/start' },
  { icon: Truck, label: 'vehicles', to: '/vehicles' },
  { icon: Users, label: 'drivers', to: '/drivers' },
  { icon: FileText, label: 'reports', to: '/reports' },
  { icon: AlertTriangle, label: 'issues', to: '/issues' },
  { icon: Wrench, label: 'repairs', to: '/repairs' },
  { icon: Settings, label: 'settings', to: '/settings' },
]

const driverItems = [
  { icon: User, label: 'driverDashboard', to: '/driver' },
  { icon: User, label: 'profile', to: '/driver/profile' },
  { icon: Truck, label: 'vehicles', to: '/driver/vehicles' },
  { icon: FileText, label: 'reports', to: '/driver/reports' },
  { icon: ClipboardList, label: 'inspections', to: '/operations/start' },
]

function handleNavigate(navigate: () => void) {
  navigate()
  emit('close')
}

async function handleSignOut() {
  await authStore.logout()
  emit('close')
  await router.push('/login')
}
</script>
