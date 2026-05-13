<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors">
    <div class="absolute top-4 right-4 flex items-center gap-2">
      <LanguageSelector />
      <ThemeToggle />
    </div>

    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
          <Truck :size="28" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.t('appName') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Sign in to your account</p>
      </div>

      <div class="card p-6 shadow-xl">
        <!-- Role selector -->
        <div class="mb-5">
          <label class="label">Role</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="r in roles"
              :key="r.value"
              type="button"
              @click="selectedRole = r.value"
              class="py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all"
              :class="selectedRole === r.value ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'"
            >{{ r.label }}</button>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label">{{ store.t('email') }}</label>
            <input v-model="email" type="email" class="input-field" placeholder="you@company.com" required />
          </div>
          <div>
            <label class="label">{{ store.t('password') }}</label>
            <div class="relative">
              <input v-model="password" :type="showPass ? 'text' : 'password'" class="input-field pr-10" placeholder="••••••••" required />
              <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <EyeOff v-if="showPass" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
            <div class="flex justify-end mt-1.5">
              <button type="button" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</button>
            </div>
          </div>
          <button type="submit" class="btn-primary w-full py-3 text-base gap-2">
            <LogIn :size="18" /> {{ store.t('login') }}
          </button>
        </form>

        <div class="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <RouterLink to="/register/company" class="w-full block text-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Create a company account
          </RouterLink>
          <RouterLink to="/register/driver" class="w-full block text-center text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Driver? Register with invitation code
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Truck, Eye, EyeOff, LogIn } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()
const router = useRouter()

const roles = [
  { value: 'manager', label: 'Company Manager' },
  { value: 'driver', label: 'Driver / Operator' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'admin', label: 'Admin' },
]

const selectedRole = ref<'manager' | 'driver' | 'mechanic' | 'admin'>('manager')
const email = ref('')
const password = ref('')
const showPass = ref(false)

function handleLogin() {
  store.setRole(selectedRole.value)
  if (selectedRole.value === 'driver') router.push('/driver')
  else router.push('/dashboard')
}
</script>
