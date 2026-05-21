import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './index.css'

import { useAuthStore } from '@/stores/authStore'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore()

await authStore.loadSession()

app.use(router)

app.mount('#root')
