<template>
  <AppLayout title="Settings">
    <div class="flex flex-col sm:flex-row gap-5">
      <!-- Sidebar tabs -->
      <div class="sm:w-52 flex-shrink-0">
        <div class="card p-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            :class="activeTab === tab.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
          >
            <component :is="tab.icon" :size="16" />
            <span class="flex-1 text-left">{{ tab.label }}</span>
            <ChevronRight v-if="activeTab === tab.id" :size="14" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Company Profile -->
        <div v-if="activeTab === 'company'" class="card p-5">
          <h2 class="font-bold text-gray-900 dark:text-white mb-1">Company Profile</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Manage your company information and settings.</p>
          <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Building2 :size="28" class="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white">Acme Trucking Inc.</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">DOT #12345678 · Los Angeles, CA</p>
            </div>
            <button class="ml-auto btn-secondary text-sm">Change Logo</button>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div v-for="f in companyFields" :key="f.label"><label class="label">{{ f.label }}</label><input class="input-field" :value="f.value" /></div>
          </div>
          <div class="mt-5 flex gap-3 justify-end">
            <button class="btn-secondary text-sm">Cancel</button>
            <button class="btn-primary text-sm">Save Changes</button>
          </div>
        </div>

        <!-- Users & Roles -->
        <div v-else-if="activeTab === 'users'" class="card overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 class="font-bold text-gray-900 dark:text-white">Users &amp; Roles</h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm">Manage team members and their permissions.</p>
            </div>
            <button class="btn-primary text-sm gap-1.5"><Users :size="14" /> Invite User</button>
          </div>
          <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <div v-for="u in users" :key="u.name" class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{{ u.avatar }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ u.name }}</p>
                <p class="text-xs text-gray-400">{{ u.email }}</p>
              </div>
              <span class="badge-blue text-xs">{{ u.role }}</span>
              <span :class="u.status === 'active' ? 'badge-green' : 'badge-orange'">{{ u.status }}</span>
              <button class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Edit</button>
            </div>
          </div>
        </div>

        <!-- Language -->
        <div v-else-if="activeTab === 'language'" class="card p-5">
          <h2 class="font-bold text-gray-900 dark:text-white mb-1">Language Settings</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose the display language for the application.</p>
          <div class="space-y-2">
            <button
              v-for="lang in languages"
              :key="lang.code"
              @click="store.setLanguage(lang.code)"
              class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all"
              :class="store.language === lang.code ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'"
            >
              <span class="text-2xl">{{ lang.flag }}</span>
              <div class="flex-1 text-left">
                <p class="font-medium" :class="store.language === lang.code ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'">{{ lang.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ lang.native }}</p>
              </div>
              <div v-if="store.language === lang.code" class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check :size="13" class="text-white" />
              </div>
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div v-else-if="activeTab === 'theme'" class="card p-5">
          <h2 class="font-bold text-gray-900 dark:text-white mb-1">Appearance</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Customize how FleetCheck Pro looks on your device.</p>
          <div class="grid grid-cols-3 gap-3 mb-6">
            <button
              v-for="opt in themeOptions"
              :key="opt.id"
              @click="selectTheme(opt.id)"
              class="p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all"
              :class="appTheme === opt.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'"
            >
              <div class="w-full h-16 rounded-lg border flex items-center justify-center overflow-hidden" :class="opt.preview">
                <component :is="opt.icon" :size="20" :class="opt.iconClass" />
              </div>
              <span class="text-sm font-medium" :class="appTheme === opt.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'">{{ opt.label }}</span>
              <div v-if="appTheme === opt.id" class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"><Check :size="11" class="text-white" /></div>
            </button>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <h3 class="font-medium text-gray-900 dark:text-white text-sm mb-3">Color Accent</h3>
            <div class="flex gap-3">
              <button v-for="c in accentColors" :key="c" class="w-8 h-8 rounded-full hover:scale-110 transition-transform" :class="[c, c === 'bg-blue-500' ? 'ring-2 ring-offset-2 ring-blue-500' : '']" />
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div v-else-if="activeTab === 'notifications'" class="card p-5">
          <h2 class="font-bold text-gray-900 dark:text-white mb-1">Notification Settings</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose which events you want to be notified about.</p>
          <div class="space-y-5">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notification Types</h3>
              <div class="space-y-3">
                <div v-for="item in notifItems" :key="item.key" class="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</span>
                  <button @click="notifSettings[item.key] = !notifSettings[item.key]" class="w-11 h-6 rounded-full transition-colors relative" :class="notifSettings[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'">
                    <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" :class="notifSettings[item.key] ? 'left-5' : 'left-0.5'" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-5 flex justify-end"><button class="btn-primary text-sm">Save Settings</button></div>
        </div>

        <!-- Security -->
        <div v-else-if="activeTab === 'security'" class="card p-5">
          <h2 class="font-bold text-gray-900 dark:text-white mb-1">Security Settings</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Manage password, 2FA, and session settings.</p>
          <div class="space-y-5">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Change Password</h3>
              <div class="space-y-3">
                <div v-for="label in ['Current Password','New Password','Confirm New Password']" :key="label">
                  <label class="label">{{ label }}</label>
                  <input type="password" class="input-field" placeholder="••••••••" />
                </div>
                <button class="btn-primary text-sm">Update Password</button>
              </div>
            </div>
            <div class="border-t border-gray-100 dark:border-gray-700 pt-5">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Two-Factor Authentication</h3>
                  <p class="text-xs text-gray-400 mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <button class="btn-secondary text-sm">Enable 2FA</button>
              </div>
            </div>
            <div class="border-t border-gray-100 dark:border-gray-700 pt-5">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Sessions</h3>
                  <p class="text-xs text-gray-400 mt-0.5">2 active sessions</p>
                </div>
                <button class="btn-danger text-sm">Revoke All</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Placeholder tabs -->
        <div v-else class="card p-8 text-center">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <component :is="tabs.find(t => t.id === activeTab)?.icon" :size="28" class="text-gray-400" />
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ tabs.find(t => t.id === activeTab)?.label }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm">This section is coming soon.</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Building2, Users, Globe, Sun, Moon, Monitor, ClipboardList, Bell, Shield, CreditCard, ChevronRight, Check } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import type { Language } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'

const store = useAppStore()
const activeTab = ref('company')
const appTheme = ref<'light' | 'dark' | 'system'>('system')

const tabs = [
  { id: 'company', icon: Building2, label: 'Company Profile' },
  { id: 'users', icon: Users, label: 'Users & Roles' },
  { id: 'language', icon: Globe, label: 'Languages' },
  { id: 'theme', icon: Sun, label: 'Theme' },
  { id: 'templates', icon: ClipboardList, label: 'Inspection Templates' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'billing', icon: CreditCard, label: 'Billing' },
]

const languages = [
  { code: 'en' as Language, flag: '🇺🇸', name: 'English', native: 'English' },
  { code: 'uk' as Language, flag: '🇺🇦', name: 'Ukrainian', native: 'Українська' },
  { code: 'es' as Language, flag: '🇪🇸', name: 'Spanish', native: 'Español' },
  { code: 'fr' as Language, flag: '🇫🇷', name: 'French', native: 'Français' },
]

const themeOptions = [
  { id: 'light', icon: Sun, label: 'Light', preview: 'bg-white border-gray-200', iconClass: 'text-gray-700' },
  { id: 'dark', icon: Moon, label: 'Dark', preview: 'bg-gray-900 border-gray-700', iconClass: 'text-gray-200' },
  { id: 'system', icon: Monitor, label: 'System', preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-300', iconClass: 'text-gray-500' },
]

const accentColors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-slate-500', 'bg-cyan-500']

function selectTheme(id: string) {
  appTheme.value = id as 'light' | 'dark' | 'system'
  if (id === 'light' && store.theme === 'dark') store.toggleTheme()
  if (id === 'dark' && store.theme === 'light') store.toggleTheme()
  if (id === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if ((prefersDark && store.theme === 'light') || (!prefersDark && store.theme === 'dark')) store.toggleTheme()
  }
}

const companyFields = [
  { label: 'Company Name', value: 'Acme Trucking Inc.' },
  { label: 'DOT Number', value: '12345678' },
  { label: 'Phone', value: '+1 (555) 234-5678' },
  { label: 'Email', value: 'info@acmetruck.com' },
  { label: 'Address', value: '456 Fleet Ave, Los Angeles, CA' },
  { label: 'Website', value: 'https://acmetruck.com' },
]

const users = [
  { name: 'James Davis', email: 'james@acme.com', role: 'Fleet Manager', status: 'active', avatar: 'JD' },
  { name: 'John Smith', email: 'john@acme.com', role: 'Driver', status: 'active', avatar: 'JS' },
  { name: 'Maria Garcia', email: 'maria@acme.com', role: 'Driver', status: 'active', avatar: 'MG' },
  { name: 'Tom Blake', email: 'tom@acme.com', role: 'Mechanic', status: 'active', avatar: 'TB' },
  { name: 'Alex Rodriguez', email: 'alex@acme.com', role: 'Driver', status: 'pending', avatar: 'AR' },
]

const notifItems = [
  { key: 'driverApproval', label: 'New driver pending approval' },
  { key: 'failedInspection', label: 'Failed inspection submitted' },
  { key: 'outOfService', label: 'Vehicle marked out of service' },
  { key: 'repairComplete', label: 'Repair request completed' },
  { key: 'licenseExpiry', label: 'Driver license expiring soon' },
  { key: 'inspectionOverdue', label: 'Inspection overdue' },
]

const notifSettings = reactive<Record<string, boolean>>({
  driverApproval: true, failedInspection: true, outOfService: true,
  repairComplete: true, licenseExpiry: true, inspectionOverdue: false,
})
</script>
