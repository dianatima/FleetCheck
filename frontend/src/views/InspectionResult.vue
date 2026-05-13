<template>
  <AppLayout title="Inspection Result">
    <RouterLink to="/inspect/pre" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> Back to Inspection
    </RouterLink>

    <!-- Result banner -->
    <div class="rounded-2xl p-8 text-center mb-6" :class="passed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'">
      <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" :class="passed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'">
        <CheckCircle v-if="passed" :size="40" class="text-green-500" />
        <AlertTriangle v-else :size="40" class="text-red-500" />
      </div>
      <h2 class="text-2xl font-bold mb-2" :class="passed ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'">
        {{ passed ? store.t('inspectionPassed') : store.t('inspectionFailed') }}
      </h2>
      <p class="text-sm" :class="passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
        {{ passed ? 'Vehicle is ready for operation. All inspection items passed.' : `${failedItems.length} issue(s) found. Manager review required before operating this vehicle.` }}
      </p>
    </div>

    <!-- Summary -->
    <div class="card p-5 mb-5">
      <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Inspection Summary</h3>
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">54</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Passed</div>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ failedItems.length }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">Failed</div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-gray-600 dark:text-gray-300">4</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">N/A</div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div><span class="font-medium text-gray-700 dark:text-gray-300">Vehicle:</span> Kenworth T680 · #1042</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">Driver:</span> John Smith</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">Type:</span> Pre-Trip Inspection</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">Time:</span> May 12, 2026 7:24 AM</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">Duration:</span> 18 minutes</div>
        <div><span class="font-medium text-gray-700 dark:text-gray-300">Photos taken:</span> 3</div>
      </div>
    </div>

    <!-- Failed items -->
    <div v-if="!passed" class="card mb-5">
      <div class="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-700">
        <AlertTriangle :size="16" class="text-red-500" />
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Failed Items</h3>
      </div>
      <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
        <div v-for="item in failedItems" :key="item.item" class="p-4">
          <div class="flex items-start justify-between gap-2 mb-1">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.item }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.section }}</p>
            </div>
            <span :class="item.severity === 'high' ? 'badge-red' : 'badge-orange'">{{ item.severity }}</span>
          </div>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1.5 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{{ item.comment }}</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-3 pb-4">
      <template v-if="!passed">
        <RouterLink to="/repairs" class="btn-danger w-full py-3 gap-2 text-sm justify-center inline-flex">
          <Wrench :size="16" /> {{ store.t('createRepairRequest') }}
        </RouterLink>
        <button class="w-full flex items-center justify-center gap-2 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 font-medium rounded-xl hover:bg-orange-100 transition-colors text-sm">
          <Bell :size="16" /> {{ store.t('notifyManager') }}
        </button>
      </template>
      <RouterLink to="/reports" class="btn-secondary w-full py-3 gap-2 text-sm justify-center inline-flex">
        <FileText :size="16" /> View Full Report
      </RouterLink>
      <RouterLink :to="passed ? '/driver' : '/inspect/pre'" class="btn-secondary w-full py-3 gap-2 text-sm justify-center inline-flex">
        <RotateCcw :size="16" /> {{ passed ? 'Back to Dashboard' : 'Fix & Resubmit' }}
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, CheckCircle, AlertTriangle, Wrench, Bell, FileText, RotateCcw } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'

const store = useAppStore()
const passed = computed(() => store.inspectionResult !== 'fail')

const failedItems = [
  { section: 'Tires & Wheels', item: 'Left rear tire pressure', severity: 'high', comment: 'Tire pressure at 65 PSI, minimum required 80 PSI' },
  { section: 'Lights & Signals', item: 'Left turn signal', severity: 'medium', comment: 'Bulb not functioning, needs replacement' },
]
</script>
