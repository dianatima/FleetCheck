<template>
  <AppLayout :title="isPostTrip ? store.t('postTripInspection') : store.t('preTripInspection')">
    <RouterLink to="/driver" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('back') }}
    </RouterLink>

    <!-- Vehicle & info strip -->
    <div class="card p-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('vehicle') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">Kenworth T680 · #1042</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('driver') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">John Smith</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('dateLabel') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">May 12, 2026 · 7:20 AM</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('odometer') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">125,847 mi</span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="card p-4 mb-4">
      <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <span>{{ doneCount }} / {{ items.length }} {{ store.t('checked') }}</span>
        <span class="font-semibold text-blue-600 dark:text-blue-400">{{ progress }}%</span>
      </div>
      <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }" />
      </div>
      <div class="flex items-center justify-between mt-2">
        <div class="flex gap-4 text-xs">
          <span class="text-green-600 dark:text-green-400">{{ passCount }} {{ store.t('okLabel') }}</span>
          <span class="text-red-500 dark:text-red-400">{{ failCount }} {{ store.t('issuesLabel') }}</span>
        </div>
        <button @click="markAllPass"
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border-2 transition-all"
          :class="allPass ? 'bg-green-500 border-green-500 text-white' : 'border-green-300 text-green-600 dark:border-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'">
          <CheckCheck :size="13" /> {{ store.t('markAllOk') }}
        </button>
      </div>
    </div>

    <!-- Checklist -->
    <div class="card divide-y divide-gray-100 dark:divide-gray-700 mb-4">
      <div v-for="item in items" :key="item.id" class="p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <component :is="item.icon" :size="18" class="flex-shrink-0"
              :class="item.state === 'pass' ? 'text-green-500' : item.state === 'fail' ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'" />
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ store.t(item.labelKey) }}</span>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button @click="setState(item, 'pass')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'pass' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-500'">
              <Check :size="16" />
            </button>
            <button @click="setState(item, 'fail')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'fail' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-500'">
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- Note on fail -->
        <Transition name="slide">
          <div v-if="item.state === 'fail'" class="mt-3 ml-7">
            <textarea v-model="item.note" :placeholder="store.t('describeIssue')" rows="2"
              class="w-full text-sm input-field resize-none placeholder-red-300 dark:placeholder-red-700 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10" />
            <div class="flex items-center gap-3 mt-2">
              <button @click="addPhoto(item)" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Camera :size="13" /> {{ store.t('addPhoto') }}
              </button>
              <div v-if="item.photos.length" class="flex gap-1.5">
                <div v-for="(url, pi) in item.photos" :key="pi" class="relative">
                  <img :src="url" alt="" class="w-10 h-10 rounded-lg object-cover border border-red-200 dark:border-red-800" />
                  <button @click="item.photos.splice(pi, 1)" class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <X :size="7" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Signature -->
    <div class="card p-5 mb-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ store.t('driverSignature') }}</h3>
      <div class="h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
        <span class="text-sm text-gray-400 dark:text-gray-500">{{ store.t('signHere') }}</span>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex gap-3 pb-4">
      <button class="btn-secondary flex-1 py-3 text-sm">{{ store.t('saveDraft') }}</button>
      <button @click="handleSubmit" class="btn-primary flex-1 py-3 text-sm">{{ store.t('submitInspection') }}</button>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Camera, Check, CheckCheck, X, Gauge, Lightbulb, Disc, Droplets, ShieldCheck, FileText } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import AppLayout from '../components/layout/AppLayout.vue'

defineProps<{ isPostTrip?: boolean }>()
const store = useAppStore()
const router = useRouter()

type State = 'pass' | 'fail' | null
interface Item { id: string; labelKey: string; icon: unknown; state: State; note: string; photos: string[] }

const items = reactive<Item[]>([
  { id: 'tires',    labelKey: 'tiresWheels',     icon: Gauge,       state: null, note: '', photos: [] },
  { id: 'lights',   labelKey: 'lightsSignals',    icon: Lightbulb,   state: null, note: '', photos: [] },
  { id: 'brakes',   labelKey: 'brakes',           icon: Disc,        state: null, note: '', photos: [] },
  { id: 'fluids',   labelKey: 'fluidLevels',      icon: Droplets,    state: null, note: '', photos: [] },
  { id: 'safety',   labelKey: 'safetyEquipment',  icon: ShieldCheck, state: null, note: '', photos: [] },
  { id: 'docs',     labelKey: 'documentsLabel',   icon: FileText,    state: null, note: '', photos: [] },
])

const photoUrls = [
  'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=80',
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?w=80',
]

function setState(item: Item, s: State) {
  item.state = item.state === s ? null : s
}

function addPhoto(item: Item) {
  const url = photoUrls[item.photos.length % photoUrls.length]
  if (!item.photos.includes(url)) item.photos.push(url)
}

function markAllPass() {
  items.forEach(i => { i.state = 'pass' })
}

const allPass  = computed(() => items.every(i => i.state === 'pass'))
const doneCount = computed(() => items.filter(i => i.state !== null).length)
const passCount = computed(() => items.filter(i => i.state === 'pass').length)
const failCount = computed(() => items.filter(i => i.state === 'fail').length)
const progress  = computed(() => Math.round((doneCount.value / items.length) * 100))

function handleSubmit() {
  store.setInspectionResult(failCount.value > 0 ? 'fail' : 'pass')
  router.push('/inspect/result')
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
