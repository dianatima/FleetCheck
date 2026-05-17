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
          <input class="input-field pl-9 py-1.5 text-sm" :placeholder="store.t('search')" />
        </div>
      </div>
      <div v-if="authStore.currentCompany" class="hidden md:flex items-center gap-2 flex-1 max-w-xs min-w-0">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ store.t('activeBusiness') }}</span>
        <select
          v-if="authStore.hasMultipleCompanies"
          v-model="selectedCompanyId"
          class="input-field py-1.5 text-sm w-full"
        >
          <option v-for="membership in authStore.companyMemberships" :key="membership.company_id" :value="membership.company_id">
            {{ membership.company_name }}
          </option>
        </select>
        <div v-else class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
          {{ authStore.currentCompany.company_name }}
        </div>
      </div>
      <div class="flex items-center gap-1">
        <LanguageSelector :compact="true" />
        <ThemeToggle />
        <NotificationBell />
        <div class="ml-1 h-8 w-px bg-gray-200 dark:bg-gray-700" />
        <div class="flex items-center gap-2 pl-1">
          <img
            v-if="avatarUrl && !avatarLoadFailed"
            :src="avatarUrl"
            :alt="displayName"
            class="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            referrerpolicy="no-referrer"
            @error="avatarLoadFailed = true"
          />
          <div v-else class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm select-none">{{ userInitial }}</div>
          <div class="hidden sm:block min-w-0">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ displayName }}</div>
            <div v-if="authStore.currentCompany" class="text-[11px] text-gray-400 dark:text-gray-500 truncate">{{ authStore.currentCompany.company_name }}</div>
          </div>
        </div>
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
import { computed, ref, watch } from 'vue'
import { Menu, Search } from 'lucide-vue-next'
import Sidebar from './Sidebar.vue'
import MobileNav from './MobileNav.vue'
import ThemeToggle from '../shared/ThemeToggle.vue'
import LanguageSelector from '../shared/LanguageSelector.vue'
import NotificationBell from '../shared/NotificationBell.vue'
import { useAppStore } from '../../stores/app'
import { useAuthStore } from '../../stores/authStore'

defineProps<{ title: string }>()

const store = useAppStore()
const authStore = useAuthStore()
const avatarLoadFailed = ref(false)

const displayName = computed(() => {
  const firstName = authStore.profile?.first_name?.trim()
  const lastName = authStore.profile?.last_name?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  if (fullName) {
    return fullName
  }

  const email = authStore.user?.email?.trim()

  if (email) {
    return email.split('@')[0]
  }

  return 'User'
})

const avatarUrl = computed(() => {
  const profileAvatar = authStore.profile?.avatar_url?.trim()

  if (profileAvatar) {
    return profileAvatar
  }

  const metadata = authStore.user?.user_metadata

  return metadata?.avatar_url?.trim() || metadata?.picture?.trim() || metadata?.photo_url?.trim() || null
})

const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const selectedCompanyId = computed({
  get: () => authStore.companyId || '',
  set: (companyId: string) => {
    if (companyId) {
      authStore.setActiveCompany(companyId)
    }
  },
})

watch(avatarUrl, () => {
  avatarLoadFailed.value = false
})
</script>
