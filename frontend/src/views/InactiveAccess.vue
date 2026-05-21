<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors"
  >
    <div class="card max-w-md w-full p-8 text-center shadow-xl">
      <div
        class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Ban :size="36" class="text-red-500" />
      </div>

      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Access inactive
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        Your driver access is disabled. Contact your fleet manager before
        signing in again.
      </p>

      <div class="space-y-3">
        <RouterLink to="/login" class="btn-primary w-full py-2.5 justify-center">
          Go to login
        </RouterLink>
        <RouterLink to="/" class="btn-secondary w-full py-2.5 justify-center">
          Back to home
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Ban } from "lucide-vue-next";
</script>
