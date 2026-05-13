<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
    <div class="max-w-md w-full text-center">
      <div class="card p-8 shadow-xl">
        <div class="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock :size="36" class="text-orange-500" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">{{ store.t('pendingApproval') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{{ store.t('pendingMessage') }}</p>

        <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6 text-left">
          <h3 class="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">What happens next?</h3>
          <ul class="space-y-1.5 text-sm text-orange-700 dark:text-orange-400">
            <li v-for="item in steps" :key="item" class="flex items-start gap-2">
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="space-y-3">
          <RouterLink to="/login" class="btn-primary w-full py-2.5 justify-center">Go to Login</RouterLink>
          <RouterLink to="/" class="btn-secondary w-full py-2.5 justify-center">Back to Home</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'

const store = useAppStore()

const steps = [
  'Your manager will review your registration',
  "You'll receive an email when approved",
  'Once approved, you can log in and start inspections',
]
</script>
