import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './index.css'

import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore()
const skipInitialAccessValidation = [
  '/auth/callback',
  '/set-password',
  '/auth/set-password',
  '/password-setup',
].includes(window.location.pathname)

await authStore.loadSession({
  validateAccess: !skipInitialAccessValidation,
})

app.use(router)

supabase.auth.onAuthStateChange((event, session) => {
  if (event !== 'SIGNED_OUT' && session) return

  authStore.clearAuthState()

  const currentRoute = router.currentRoute.value
  const isProtectedRoute = currentRoute.matched.some(
    (record) => record.meta?.requiresAuth
  )

  if (isProtectedRoute) {
    void router.replace('/login')
  }
})

app.mount('#root')
