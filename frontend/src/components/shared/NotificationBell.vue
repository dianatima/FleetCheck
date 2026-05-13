<template>
  <div ref="containerRef" class="relative">
    <button @click="open = !open" class="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <Bell :size="18" />
      <span v-if="unreadCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{{ unreadCount }}</span>
    </button>
    <Transition name="fade">
      <div v-if="open" class="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
          <div class="flex items-center gap-2">
            <span v-if="unreadCount > 0" class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ unreadCount }} new</span>
            <button @click="open = false" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X :size="14" class="text-gray-400" />
            </button>
          </div>
        </div>
        <div class="max-h-80 overflow-y-auto">
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
          <button class="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">View all notifications</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell, X, CheckCircle, AlertTriangle, Clock, Wrench, UserPlus, FileText } from 'lucide-vue-next'

const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const notifications = [
  { id: 1, icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'New driver pending approval', desc: 'John Smith is waiting for approval', time: '2m ago', unread: true },
  { id: 2, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', title: 'Failed inspection submitted', desc: 'Unit #1042 - Brake issue reported', time: '15m ago', unread: true },
  { id: 3, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', title: 'Repair request completed', desc: 'Unit #2031 - Oil change done', time: '1h ago', unread: true },
  { id: 4, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', title: 'Driver license expiring soon', desc: "Maria Garcia's license expires in 14 days", time: '2h ago', unread: false },
  { id: 5, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', title: 'Vehicle marked out of service', desc: 'Unit #0521 has been grounded', time: '3h ago', unread: false },
  { id: 6, icon: FileText, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', title: 'Inspection overdue', desc: 'Unit #3012 has not been inspected in 48h', time: '5h ago', unread: false },
  { id: 7, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', title: 'Repair completed', desc: 'Unit #1099 is ready for operation', time: 'Yesterday', unread: false },
]

const unreadCount = computed(() => notifications.filter(n => n.unread).length)

function onOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
