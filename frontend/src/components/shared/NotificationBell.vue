<template>
  <div ref="containerRef" class="relative">
    <button @click="open = !open" class="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <Bell :size="18" />
      <span v-if="unreadCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{{ unreadCount }}</span>
    </button>
    <Transition name="fade">
      <div v-if="open" class="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">{{ store.t('notifications') }}</h3>
          <div class="flex items-center gap-2">
            <span v-if="unreadCount > 0" class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ unreadCount }} {{ store.t('new') }}</span>
            <button @click="open = false" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X :size="14" class="text-gray-400" />
            </button>
          </div>
        </div>
        <div class="max-h-80 overflow-y-auto">
          <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ copy.noNotifications }}
          </div>
          <div
            v-for="n in notifications"
            :key="n.id"
            class="flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            :class="n.unread ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''"
          >
            <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" :class="n.bg">
              <component :is="n.icon" :size="14" :class="n.color" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium" :class="n.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'">{{ n.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ n.desc }}</p>
              <p class="text-[10px] text-gray-400 mt-1">{{ n.time }}</p>
            </div>
            <div v-if="n.unread" class="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
          </div>
        </div>
        <div class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
          <button class="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">{{ store.t('viewAllNotifications') }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Bell, X, Cake } from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '@/lib/supabase'

const store = useAppStore()
const authStore = useAuthStore()
const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)

type NotificationItem = {
  id: string
  icon: any
  color: string
  bg: string
  title: string
  desc: string
  time: string
  unread: boolean
}

const copyByLanguage = {
  en: { birthdayToday: 'Birthday today', noNotifications: 'No notifications yet.', today: 'Today', turns: 'turns' },
  uk: { birthdayToday: 'День народження сьогодні', noNotifications: 'Сповіщень поки немає.', today: 'Сьогодні', turns: 'виповнюється' },
  es: { birthdayToday: 'Cumpleaños hoy', noNotifications: 'Aún no hay notificaciones.', today: 'Hoy', turns: 'cumple' },
  fr: { birthdayToday: 'Anniversaire aujourd’hui', noNotifications: 'Aucune notification pour le moment.', today: 'Aujourd’hui', turns: 'a' },
} as const

const copy = computed(() => copyByLanguage[(store.language as keyof typeof copyByLanguage) || 'en'] || copyByLanguage.en)
const notifications = ref<NotificationItem[]>([])

function ageToday(birthday: string) {
  if (!birthday) return null
  const birthDate = new Date(birthday)
  if (Number.isNaN(birthDate.getTime())) return null
  return new Date().getFullYear() - birthDate.getFullYear()
}

function isBirthdayToday(birthday: string) {
  if (!birthday) return false
  const birthDate = new Date(birthday)
  if (Number.isNaN(birthDate.getTime())) return false
  const today = new Date()
  return birthDate.getDate() === today.getDate() && birthDate.getMonth() === today.getMonth()
}

async function loadNotifications() {
  if (!authStore.companyId) {
    notifications.value = []
    return
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('company_memberships')
    .select('user_id')
    .eq('company_id', authStore.companyId)
    .eq('role', 'driver')

  if (membershipError) {
    notifications.value = []
    return
  }

  const userIds = (memberships || []).map((membership) => membership.user_id).filter(Boolean)

  if (!userIds.length) {
    notifications.value = []
    return
  }

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, auth_user_id, first_name, last_name, birthday')
    .in('auth_user_id', userIds)

  notifications.value = (drivers || [])
    .filter((driver) => isBirthdayToday(driver.birthday || ''))
    .map((driver) => {
      const name = [driver.first_name, driver.last_name].filter(Boolean).join(' ').trim() || 'Driver'
      const age = ageToday(driver.birthday || '')

      return {
        id: `birthday-${driver.id}`,
        icon: Cake,
        color: 'text-pink-500',
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        title: copy.value.birthdayToday,
        desc: age ? `${name} ${copy.value.turns} ${age}` : name,
        time: copy.value.today,
        unread: true,
      } satisfies NotificationItem
    })
}

const unreadCount = computed(() => notifications.value.filter(n => n.unread).length)

function onOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) open.value = false
}
onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  loadNotifications()
})
onUnmounted(() => document.removeEventListener('mousedown', onOutside))

watch(() => [authStore.companyId, store.language], () => {
  loadNotifications()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
