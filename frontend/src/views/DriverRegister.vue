<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/login" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft :size="16" /> {{ store.t('backToLogin') }}
        </RouterLink>
        <div class="flex items-center gap-2">
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
          <UserPlus :size="24" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.t('driverRegistration') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">{{ store.t('driverRegSubtitle') }}</p>
      </div>

      <div class="card p-6 shadow-sm">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Invitation code -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <label class="label text-blue-700 dark:text-blue-300">{{ store.t('invitationCode') }} *</label>
            <input class="input-field bg-white dark:bg-gray-800 mt-1" placeholder="e.g. FCP-2847-XQRT" required />
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1.5">{{ store.t('askManagerForCode') }}</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="label">{{ store.t('firstName') }} *</label><input class="input-field" placeholder="John" required /></div>
            <div><label class="label">{{ store.t('lastName') }} *</label><input class="input-field" placeholder="Smith" required /></div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="label">{{ store.t('phone') }} *</label><input class="input-field" type="tel" placeholder="+1 (555) 000-0000" required /></div>
            <div><label class="label">{{ store.t('email') }} *</label><input class="input-field" type="email" placeholder="john@email.com" required /></div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="label">{{ store.t('licenseNumber') }} *</label><input class="input-field" placeholder="DL123456789" required /></div>
            <BaseDateInput v-model="licenseExpiry" :label="store.t('expiryDate')" required />
          </div>
          <BaseDateInput v-model="dateOfBirth" :label="store.t('dateOfBirth')" required />
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="label">{{ store.t('password') }} *</label>
              <div class="relative">
                <input :type="showPass ? 'text' : 'password'" class="input-field pr-10" :placeholder="store.t('min8Chars')" required />
                <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <EyeOff v-if="showPass" :size="16" /><Eye v-else :size="16" />
                </button>
              </div>
            </div>
            <div>
              <label class="label">{{ store.t('confirmPassword') }} *</label>
              <div class="relative">
                <input :type="showConfirm ? 'text' : 'password'" class="input-field pr-10" :placeholder="store.t('repeatPassword')" required />
                <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <EyeOff v-if="showConfirm" :size="16" /><Eye v-else :size="16" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="label">{{ store.t('uploadDriverLicensePhoto') }}</label>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="(sideKey, idx) in ['frontSide', 'backSide']" :key="idx" class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                <Upload :size="20" class="mx-auto text-gray-400 mb-1.5" />
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ store.t(sideKey) }}</p>
                <p class="text-[10px] text-gray-400 mt-0.5">{{ store.t('jpgPng') }}</p>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input type="checkbox" class="mt-0.5 rounded" id="terms" required />
            <label for="terms" class="text-xs text-gray-600 dark:text-gray-400">
              {{ store.t('iAgreeToThe') }} <span class="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{{ store.t('termsOfService') }}</span> and <span class="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{{ store.t('privacyPolicy') }}</span>. {{ store.t('iConfirmAccurate') }}
            </label>
          </div>

          <button type="submit" class="btn-primary w-full py-3 text-base gap-2">
            <UserPlus :size="18" /> {{ store.t('createDriverAccount') }}
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, UserPlus, Eye, EyeOff, Upload } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'
import BaseDateInput from '@/components/shared/BaseDateInput.vue'

const store = useAppStore()
const router = useRouter()
const showPass = ref(false)
const showConfirm = ref(false)
const licenseExpiry = ref('')
const dateOfBirth = ref('')

function handleSubmit() {
  router.push('/pending')
}
</script>
