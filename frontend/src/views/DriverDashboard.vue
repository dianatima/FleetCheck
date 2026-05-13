<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors pb-20">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-bold text-gray-900 dark:text-white">FleetCheck Pro</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Driver Portal</p>
        </div>
        <div class="flex items-center gap-1">
          <NotificationBell />
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <div class="px-4 pt-5 space-y-5 max-w-xl mx-auto">
      <!-- Greeting -->
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">JS</div>
        <div>
          <h2 class="font-bold text-gray-900 dark:text-white">Good morning, John!</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Tuesday, May 12, 2026</p>
        </div>
      </div>

      <!-- Assigned vehicle -->
      <div class="card p-4 border-l-4 border-l-blue-500">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">Assigned Vehicle</p>
            <h3 class="font-bold text-gray-900 dark:text-white text-lg">Kenworth T680</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Unit #1042 · Plate: ABC-1234</p>
          </div>
          <div class="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <Truck :size="28" class="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span class="badge-green">Active</span>
          <span class="text-xs text-gray-400 flex items-center gap-1"><Clock :size="11" /> Last inspection: Today 7:24 AM</span>
        </div>
      </div>

      <!-- Status pills -->
      <div class="flex gap-3">
        <div class="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
          <CheckCircle :size="20" class="text-green-500 mx-auto mb-1" />
          <p class="text-xs font-semibold text-green-700 dark:text-green-400">Pre-Trip</p>
          <p class="text-[10px] text-green-600 dark:text-green-500">Completed</p>
        </div>
        <div class="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
          <Clock :size="20" class="text-gray-400 mx-auto mb-1" />
          <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Post-Trip</p>
          <p class="text-[10px] text-gray-400">Pending</p>
        </div>
        <div class="flex-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-center">
          <AlertTriangle :size="20" class="text-orange-500 mx-auto mb-1" />
          <p class="text-xs font-semibold text-orange-700 dark:text-orange-400">Issues</p>
          <p class="text-[10px] text-orange-600 dark:text-orange-500">1 Open</p>
        </div>
      </div>

      <!-- Main action buttons -->
      <div class="space-y-3">
        <RouterLink to="/inspect/pre" class="w-full flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm shadow-blue-500/20 transition-all">
          <div class="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center"><ClipboardCheck :size="22" /></div>
          <div class="text-left flex-1">
            <p class="font-semibold">{{ store.t('preTripInspection') }}</p>
            <p class="text-blue-200 text-xs">Start before your trip</p>
          </div>
          <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-xs font-bold">→</span>
          </div>
        </RouterLink>

        <RouterLink to="/inspect/post" class="w-full flex items-center gap-4 p-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl shadow-sm shadow-green-500/20 transition-all">
          <div class="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center"><ClipboardCheck :size="22" /></div>
          <div class="text-left flex-1">
            <p class="font-semibold">{{ store.t('postTripInspection') }}</p>
            <p class="text-green-200 text-xs">Complete after your trip</p>
          </div>
          <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span class="text-xs font-bold">→</span>
          </div>
        </RouterLink>
      </div>

      <!-- Secondary actions -->
      <div class="grid grid-cols-2 gap-3">
        <RouterLink v-for="btn in secondaryBtns" :key="btn.label" :to="btn.to" class="card p-4 text-left hover:shadow-md transition-shadow active:scale-[0.98] block">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :class="btn.bg">
            <component :is="btn.icon" :size="20" :class="btn.color" />
          </div>
          <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ btn.label }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ btn.desc }}</p>
        </RouterLink>
      </div>

      <!-- Recent inspections -->
      <div class="card">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Recent Inspections</h3>
          <RouterLink to="/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</RouterLink>
        </div>
        <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <div v-for="r in recentInspections" :key="r.date" class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="r.status === 'pass' ? 'bg-green-500' : 'bg-red-500'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ r.type }}</p>
              <p class="text-xs text-gray-400">{{ r.date }}</p>
            </div>
            <span :class="r.status === 'pass' ? 'badge-green' : 'badge-red'">{{ r.status === 'pass' ? 'Passed' : 'Failed' }}</span>
          </div>
        </div>
      </div>

      <!-- Settings & logout -->
      <div class="grid grid-cols-2 gap-3">
        <RouterLink to="/settings" class="btn-secondary w-full justify-center gap-2 py-3"><Settings :size="16" /> Settings</RouterLink>
        <RouterLink to="/" class="btn-secondary w-full justify-center gap-2 py-3 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut :size="16" /> Sign Out
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Truck, ClipboardCheck, Clock, CheckCircle, AlertTriangle, Camera, Settings, LogOut, History } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import NotificationBell from '../components/shared/NotificationBell.vue'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()

const secondaryBtns = [
  { icon: Truck, label: 'My Vehicle', desc: 'View details', to: '/vehicles/1', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: History, label: 'History', desc: 'Past inspections', to: '/reports', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/40' },
  { icon: AlertTriangle, label: 'Report Problem', desc: 'Submit repair request', to: '/repairs', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { icon: Camera, label: 'Take Photo', desc: 'Vehicle condition', to: '/vehicles/1', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
]

const recentInspections = [
  { date: 'Today 7:24 AM', type: 'Pre-Trip', status: 'pass' },
  { date: 'Yesterday 6:15 PM', type: 'Post-Trip', status: 'pass' },
  { date: 'Yesterday 7:02 AM', type: 'Pre-Trip', status: 'fail' },
  { date: 'May 10, 6:45 PM', type: 'Post-Trip', status: 'pass' },
]
</script>
