<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors">
    <div class="absolute top-4 right-4 flex items-center gap-2">
      <LanguageSelector />
      <ThemeToggle />
    </div>

    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
          <Truck :size="28" class="text-white" />
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.t('appName') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {{ isRegisterMode ? store.t('createYourCompanyAccount') : store.t('signInToYourAccount') }}
        </p>
      </div>

      <div class="card p-6 shadow-xl">

        <!-- Company register badge -->
        <div v-if="isRegisterMode" class="mb-5 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
          <Building2 :size="15" class="text-blue-600 dark:text-blue-400 shrink-0" />
          <span class="text-xs text-blue-700 dark:text-blue-300 font-medium">{{ store.t('companyAccountRegistration') }}</span>
        </div>

        <!-- Google button -->
        <button type="button" @click="handleGoogle" class="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all mb-4">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9086c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9086-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9961 8.9961 0 0 0 0 9c0 1.4514.3477 2.8268.9573 4.0418L3.964 10.71z" fill="#FBBC05"/>
            <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4255 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1632 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
          </svg>
          {{ isRegisterMode ? store.t('signUpWithGoogle') : store.t('signInWithGoogle') }}
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span class="text-xs text-gray-400">{{ store.t('or') }}</span>
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="label">{{ store.t('email') }}</label>
            <input v-model="email" type="email" class="input-field" placeholder="you@company.com" required />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="label !mb-0">{{ store.t('password') }}</label>
              <button v-if="!isRegisterMode" type="button" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">{{ store.t('forgotPassword') }}</button>
            </div>
            <div class="relative">
              <input v-model="password" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" required />
              <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <EyeOff v-if="showPass" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <!-- Confirm password (register only) -->
          <div v-if="isRegisterMode">
            <label class="label">{{ store.t('confirmPassword') }}</label>
            <div class="relative">
              <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" required />
              <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <EyeOff v-if="showConfirm" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <p v-if="confirmPassword && password !== confirmPassword" class="text-xs text-red-500 mt-1">{{ store.t('passwordsDoNotMatch') }}</p>
          </div>

          <button type="submit" class="btn-primary w-full py-3 text-base gap-2" :disabled="isRegisterMode && password !== confirmPassword && !!confirmPassword">
            <UserPlus v-if="isRegisterMode" :size="18" />
            <LogIn v-else :size="18" />
            {{ isRegisterMode ? store.t('createAccount') : store.t('login') }}
          </button>
        </form>

        <!-- Footer links -->
        <div v-if="isRegisterMode" class="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ store.t('alreadyHaveAccount') }}
            <button type="button" @click="isRegisterMode = false" class="text-blue-600 dark:text-blue-400 font-medium hover:underline">{{ store.t('signIn') }}</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Truck, Eye, EyeOff, LogIn, UserPlus, Building2 } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const showConfirm = ref(false)
const isRegisterMode = ref(false)

function handleGoogle() {
  // Google OAuth placeholder
}

function handleSubmit() {
  if (isRegisterMode.value) {
    if (password.value !== confirmPassword.value) return
    router.push('/register/company')
    return
  }
  // Role determined server-side; default to manager dashboard for demo
  store.setRole('manager')
  router.push('/dashboard')
}
</script>
