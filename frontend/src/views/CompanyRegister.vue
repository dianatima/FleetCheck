<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <header class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft :size="16" /> Back
        </RouterLink>
        <div class="flex items-center gap-2">
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <!-- Step progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between relative">
          <div class="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0" />
          <div class="absolute left-0 top-4 h-0.5 bg-blue-500 -z-0 transition-all duration-500" :style="{ width: `${((step - 1) / 4) * 100}%` }" />
          <div v-for="s in steps" :key="s.id" class="flex flex-col items-center gap-2 relative z-10">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              :class="s.id < step ? 'bg-blue-600 text-white' : s.id === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400'"
            >
              <CheckCircle v-if="s.id < step" :size="16" />
              <component v-else :is="s.icon" :size="14" />
            </div>
            <span class="text-xs font-medium hidden sm:block" :class="s.id === step ? 'text-blue-600 dark:text-blue-400' : s.id < step ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Step content -->
      <div class="card p-6 shadow-sm">

        <!-- Step 1: Company Info -->
        <div v-if="step === 1">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Company Information</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Tell us about your company to set up your workspace.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2"><label class="label">Company Name *</label><input class="input-field" placeholder="Acme Trucking Inc." /></div>
            <div><label class="label">Country *</label><select class="input-field"><option>United States</option><option>Canada</option><option>Ukraine</option><option>Mexico</option><option>France</option><option>Spain</option></select></div>
            <div><label class="label">State / Province</label><input class="input-field" placeholder="California" /></div>
            <div><label class="label">City</label><input class="input-field" placeholder="Los Angeles" /></div>
            <div><label class="label">Phone</label><input class="input-field" type="tel" placeholder="+1 (555) 000-0000" /></div>
            <div class="sm:col-span-2"><label class="label">Address</label><input class="input-field" placeholder="123 Fleet Street" /></div>
            <div><label class="label">Email</label><input class="input-field" type="email" placeholder="info@company.com" /></div>
            <div><label class="label">Website</label><input class="input-field" placeholder="https://yourcompany.com" /></div>
            <div class="sm:col-span-2"><label class="label">DOT / License / Registration Number</label><input class="input-field" placeholder="DOT #12345678" /></div>
          </div>
        </div>

        <!-- Step 2: Settings -->
        <div v-else-if="step === 2">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Company Settings</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Configure preferences for your fleet operations.</p>
          <div class="space-y-5">
            <div><label class="label">Industry Type</label><select class="input-field"><option v-for="o in industryOptions" :key="o">{{ o }}</option></select></div>
            <div><label class="label">Preferred Language</label><select class="input-field"><option value="en">English</option><option value="uk">Українська</option><option value="es">Español</option><option value="fr">Français</option></select></div>
            <div>
              <label class="label mb-2 block">Distance Units</label>
              <div class="flex gap-3">
                <button v-for="u in ['miles','km']" :key="u" @click="units = u" class="flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all" :class="units === u ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'">{{ u === 'miles' ? 'Miles (mi)' : 'Kilometers (km)' }}</button>
              </div>
            </div>
            <div>
              <label class="label mb-2 block">Time Format</label>
              <div class="flex gap-3">
                <button v-for="tf in ['12h','24h']" :key="tf" @click="timeFormat = tf" class="flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all" :class="timeFormat === tf ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'">{{ tf === '12h' ? '12-Hour (AM/PM)' : '24-Hour' }}</button>
              </div>
            </div>
            <div>
              <label class="label mb-2 block">Inspection Type</label>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="o in inspTypes" :key="o.v" @click="inspType = o.v" class="py-2.5 rounded-lg border-2 text-sm font-medium transition-all" :class="inspType === o.v ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'">{{ o.l }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Invite Drivers -->
        <div v-else-if="step === 3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Invite Drivers</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Share this code with your drivers so they can register themselves.</p>
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center mb-6">
            <p class="text-sm text-blue-600 dark:text-blue-400 font-medium mb-3">Company Invitation Code</p>
            <div class="text-3xl font-bold font-mono text-gray-900 dark:text-white tracking-widest mb-4">{{ INVITE_CODE }}</div>
            <button @click="handleCopy" class="btn-primary gap-2" :class="copied ? 'bg-green-600 hover:bg-green-600' : ''">
              <CheckCircle v-if="copied" :size="16" />
              <Copy v-else :size="16" />
              {{ copied ? 'Copied!' : 'Copy Code' }}
            </button>
          </div>
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Share via:</p>
            <div class="grid grid-cols-3 gap-3">
              <button v-for="m in ['Email','SMS','WhatsApp']" :key="m" class="btn-secondary text-sm py-2.5 justify-center">{{ m }}</button>
            </div>
          </div>
          <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p class="text-sm text-gray-600 dark:text-gray-400"><strong class="text-gray-900 dark:text-white">How it works:</strong> Drivers go to the app, click "Driver Registration", enter this code, and fill out their details. Their account will show as <span class="badge-orange inline">Pending</span> until you approve them.</p>
          </div>
        </div>

        <!-- Step 4: Add Vehicles -->
        <div v-else-if="step === 4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Add Your First Vehicle</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">You can add more vehicles later from the fleet management screen.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2"><label class="label">Vehicle Name / Description</label><input class="input-field" placeholder="e.g., Main Rig, Truck 1" /></div>
            <div><label class="label">Unit Number</label><input class="input-field" placeholder="e.g., 1042" /></div>
            <div><label class="label">License Plate</label><input class="input-field" placeholder="ABC-1234" /></div>
            <div class="sm:col-span-2"><label class="label">VIN</label><input class="input-field" placeholder="1HGBH41JXMN109186" /></div>
            <div><label class="label">Vehicle Type</label><select class="input-field"><option v-for="t in vehicleTypes" :key="t">{{ t }}</option></select></div>
            <div><label class="label">Make</label><input class="input-field" placeholder="Kenworth" /></div>
            <div><label class="label">Model</label><input class="input-field" placeholder="T680" /></div>
            <div><label class="label">Year</label><input class="input-field" type="number" placeholder="2022" /></div>
            <div><label class="label">Odometer (miles)</label><input class="input-field" type="number" placeholder="125000" /></div>
            <div><label class="label">Engine Hours</label><input class="input-field" type="number" placeholder="3200" /></div>
            <div class="sm:col-span-2">
              <label class="label">Vehicle Photo</label>
              <div class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                <Upload :size="28" class="mx-auto text-gray-400 mb-2" />
                <p class="text-sm text-gray-500 dark:text-gray-400">Click to upload or drag and drop</p>
                <p class="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Done -->
        <div v-else-if="step === 5" class="text-center py-6">
          <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle :size="40" class="text-green-500" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your workspace is ready!</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-2">Your company workspace has been set up successfully.</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-8">You can now add more vehicles, invite drivers, and start managing inspections.</p>
          <div class="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
            <div v-for="s in doneStats" :key="s.label" class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold" :class="s.color">{{ s.value }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</div>
            </div>
          </div>
          <RouterLink to="/dashboard" class="btn-primary px-8 py-3 text-base gap-2 inline-flex">Go to Dashboard <ArrowRight :size="18" /></RouterLink>
        </div>
      </div>

      <div v-if="step < 5" class="flex items-center justify-between mt-5">
        <button @click="step > 1 && step--" :disabled="step === 1" class="btn-secondary gap-2 disabled:opacity-40">
          <ArrowLeft :size="16" /> {{ store.t('back') }}
        </button>
        <span class="text-sm text-gray-400">{{ step }} / 5</span>
        <button @click="step < 5 && step++" class="btn-primary gap-2">
          {{ store.t('next') }} <ArrowRight :size="16" />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, Building2, Settings, Users, Truck, CheckCircle, Copy, Upload } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import LanguageSelector from '../components/shared/LanguageSelector.vue'
import ThemeToggle from '../components/shared/ThemeToggle.vue'

const store = useAppStore()
const step = ref(1)
const copied = ref(false)
const units = ref('miles')
const timeFormat = ref('12h')
const inspType = ref('both')
const INVITE_CODE = 'FCP-2847-XQRT'

const steps = [
  { id: 1, icon: Building2, label: 'Company Info' },
  { id: 2, icon: Settings, label: 'Settings' },
  { id: 3, icon: Users, label: 'Invite Drivers' },
  { id: 4, icon: Truck, label: 'Add Vehicles' },
  { id: 5, icon: CheckCircle, label: 'Finish' },
]

const industryOptions = ['Trucking / Freight', 'Construction Equipment', 'Boom Lift Rental', 'Delivery Fleet', 'Taxi / Passenger', 'Service Vehicles', 'Other']
const inspTypes = [{ v: 'pre', l: 'Pre-Trip Only' }, { v: 'post', l: 'Post-Trip Only' }, { v: 'both', l: 'Both' }]
const vehicleTypes = ['Semi Truck', 'Box Truck', 'Pickup Truck', 'Van', 'Excavator', 'Boom Lift', 'Forklift', 'Other']
const doneStats = [
  { label: 'Vehicles', value: '1', color: 'text-blue-600' },
  { label: 'Drivers', value: '0', color: 'text-green-600' },
  { label: 'Inspections', value: '0', color: 'text-orange-600' },
]

function handleCopy() {
  navigator.clipboard.writeText(INVITE_CODE).catch(() => {})
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>
