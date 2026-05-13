<template>
  <AppLayout :title="isPostTrip ? store.t('postTripInspection') : store.t('preTripInspection')">
    <RouterLink to="/driver" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> Back
    </RouterLink>

    <!-- Header info -->
    <div class="card p-4 mb-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div v-for="f in headerFields" :key="f.label">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ f.label }}</p>
          <p class="font-medium text-gray-900 dark:text-white">{{ f.value }}</p>
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div class="card p-4 mb-4">
      <div class="flex items-center justify-between text-sm mb-2">
        <span class="font-medium text-gray-700 dark:text-gray-300">Inspection Progress</span>
        <span class="font-bold text-blue-600 dark:text-blue-400">{{ progress }}%</span>
      </div>
      <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }" />
      </div>
      <div class="flex gap-4 mt-2 text-xs">
        <span class="text-green-600 dark:text-green-400">{{ passCount }} Passed</span>
        <span class="text-red-600 dark:text-red-400">{{ failCount }} Failed</span>
        <span class="text-gray-400">{{ totalCount - passCount - failCount }} Remaining</span>
      </div>
    </div>

    <!-- Duplicate photo warning -->
    <Transition name="fade">
      <div v-if="showDupWarning" class="mb-4 flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
        <AlertTriangle :size="18" class="text-yellow-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300">Duplicate photo detected</p>
          <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">This photo may already exist. Please take a new photo of the current condition.</p>
        </div>
        <button @click="showDupWarning = false"><X :size="16" class="text-yellow-600" /></button>
      </div>
    </Transition>

    <!-- Sections -->
    <div class="space-y-3 mb-5">
      <div v-for="section in sections" :key="section.id" class="card overflow-hidden">
        <button @click="section.expanded = !section.expanded" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <span v-if="section.items.filter(i => i.state === 'pass').length" class="w-4 h-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[9px] flex items-center justify-center font-bold">
                {{ section.items.filter(i => i.state === 'pass').length }}
              </span>
              <span v-if="section.items.filter(i => i.state === 'fail').length" class="w-4 h-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[9px] flex items-center justify-center font-bold">
                {{ section.items.filter(i => i.state === 'fail').length }}
              </span>
            </div>
            <span class="font-semibold text-gray-900 dark:text-white text-sm">{{ section.title }}</span>
            <span class="text-xs text-gray-400">({{ section.items.length }} items)</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle v-if="section.items.every(i => i.state !== null)" :size="16" class="text-green-500" />
            <ChevronUp v-if="section.expanded" :size="16" class="text-gray-400" />
            <ChevronDown v-else :size="16" class="text-gray-400" />
          </div>
        </button>

        <div v-if="section.expanded" class="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
          <div v-for="item in section.items" :key="item.id" class="p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium" :class="item.state === 'fail' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'">{{ item.label }}</span>
            </div>
            <div class="flex gap-2 mb-3">
              <button
                v-for="state in (['pass','fail','na'] as const)"
                :key="state"
                @click="item.state = state"
                class="flex-1 py-2 rounded-lg border-2 text-xs font-bold uppercase transition-all"
                :class="item.state === state
                  ? state === 'pass' ? 'bg-green-500 border-green-500 text-white'
                  : state === 'fail' ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-gray-500 border-gray-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'"
              >
                {{ state === 'pass' ? store.t('pass') : state === 'fail' ? store.t('fail') : store.t('na') }}
              </button>
            </div>

            <div v-if="item.state === 'fail'" class="mb-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
              <textarea placeholder="Describe the issue..." rows="2" class="w-full text-sm bg-transparent border-none outline-none resize-none text-gray-700 dark:text-gray-300 placeholder-red-300 dark:placeholder-red-700" />
            </div>

            <div class="flex gap-2">
              <button @click="addPhoto(section, item)" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Camera :size="13" /> {{ store.t('addPhoto') }}
              </button>
              <button class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-3">
                <MessageSquare :size="13" /> {{ store.t('addComment') }}
              </button>
            </div>

            <div v-if="item.photos.length" class="flex gap-2 mt-2 flex-wrap">
              <div v-for="(url, pi) in item.photos" :key="pi" class="relative">
                <img :src="url" alt="" class="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                <button @click="item.photos.splice(pi, 1)" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X :size="9" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div class="card p-5 mb-5">
      <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-3">Driver Signature</h3>
      <div class="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <span class="text-sm text-gray-400 dark:text-gray-500">{{ store.t('signHere') }}</span>
        <span class="text-xs text-gray-300 dark:text-gray-600">Tap or click to sign</span>
      </div>
      <p class="text-xs text-gray-400 mt-2">By signing, I certify this vehicle was inspected and all information is accurate.</p>
    </div>

    <!-- Submit -->
    <div class="flex gap-3 pb-4">
      <button class="btn-secondary flex-1 py-3 text-sm">Save Draft</button>
      <button @click="handleSubmit" class="btn-primary flex-1 py-3 text-sm">{{ store.t('submitInspection') }}</button>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Camera, MessageSquare, AlertTriangle, ChevronDown, ChevronUp, X, CheckCircle } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'

const props = defineProps<{ isPostTrip?: boolean }>()
const store = useAppStore()
const router = useRouter()
const showDupWarning = ref(false)

type ItemState = 'pass' | 'fail' | 'na' | null
interface CheckItem { id: string; label: string; state: ItemState; photos: string[] }
interface Section { id: string; title: string; items: CheckItem[]; expanded: boolean }

const sectionDefs = [
  { id: 'exterior', title: 'Exterior', items: ['Body condition','No visible damage','Mud flaps','Reflectors / markers','Fifth wheel','Coupling devices'] },
  { id: 'tires', title: 'Tires & Wheels', items: ['Tire tread depth','Tire pressure','No sidewall damage','Lug nuts secure','Spare tire','Wheel seals'] },
  { id: 'lights', title: 'Lights & Signals', items: ['Headlights','Taillights','Brake lights','Turn signals','Hazard lights','Clearance lights'] },
  { id: 'brakes', title: 'Brakes', items: ['Air pressure','Brake pedal feel','Parking brake','Emergency brake','Brake lines','Slack adjusters'] },
  { id: 'steering', title: 'Steering', items: ['Steering wheel play','Power steering fluid','Steering linkage'] },
  { id: 'cabin', title: 'Cab & Mirrors', items: ['Windshield condition','Mirrors (all)','Wipers','Horn','Seatbelt','Dashboard gauges'] },
  { id: 'fluids', title: 'Fluid Levels', items: ['Engine oil','Coolant level','Washer fluid','Fuel level','DEF level','Hydraulic fluid'] },
  { id: 'safety', title: 'Safety Equipment', items: ['Fire extinguisher','First aid kit','Warning triangles','Reflective vest'] },
  { id: 'docs', title: 'Documents', items: ['Registration','Insurance card','Driver license','Medical card','IFTA permits'] },
  { id: 'trailer', title: 'Trailer (if applicable)', items: ['Trailer lights','Trailer brakes','Cargo securement','Landing gear','Kingpin'] },
]

const sections = reactive<Section[]>(sectionDefs.map((def, si) => ({
  id: def.id,
  title: def.title,
  expanded: si === 0,
  items: def.items.map((label, i) => ({ id: `${def.id}-${i}`, label, state: null, photos: [] })),
})))

const photoUrls = [
  'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=80',
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=80',
]

function addPhoto(section: Section, item: CheckItem) {
  const url = photoUrls[Math.floor(Math.random() * photoUrls.length)]
  if (item.photos.includes(url)) {
    showDupWarning.value = true
    setTimeout(() => showDupWarning.value = false, 3000)
    return
  }
  item.photos.push(url)
}

const allItems = computed(() => sections.flatMap(s => s.items))
const totalCount = computed(() => allItems.value.length)
const passCount = computed(() => allItems.value.filter(i => i.state === 'pass').length)
const failCount = computed(() => allItems.value.filter(i => i.state === 'fail').length)
const naCount = computed(() => allItems.value.filter(i => i.state === 'na').length)
const progress = computed(() => Math.round(((passCount.value + failCount.value + naCount.value) / totalCount.value) * 100))

const headerFields = [
  { label: 'Vehicle', value: 'Kenworth T680 · Unit #1042' },
  { label: 'Driver', value: 'John Smith' },
  { label: 'Date & Time', value: 'May 12, 2026 · 7:20 AM' },
  { label: 'Location', value: '123 Depot Rd, CA' },
  { label: 'Odometer', value: '125,847 mi' },
  { label: 'Engine Hours', value: '3,214 hrs' },
]

function handleSubmit() {
  store.setInspectionResult(failCount.value > 0 ? 'fail' : 'pass')
  router.push('/inspect/result')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
