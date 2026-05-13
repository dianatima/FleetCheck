<template>
  <AppLayout title="Vehicle Detail">
    <RouterLink to="/vehicles" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> Back to Fleet
    </RouterLink>

    <div class="card overflow-hidden mb-5">
      <div class="h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=800" alt="Kenworth T680" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <h2 class="text-xl font-bold text-white">Kenworth T680</h2>
            <p class="text-white/80 text-sm">Unit #1042 · 2022</p>
          </div>
          <span class="badge-green">Active</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700">
        <button class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center"><Edit :size="15" /> Edit Vehicle</button>
        <RouterLink to="/inspect/pre" class="btn-primary gap-2 text-sm flex-1 sm:flex-none justify-center inline-flex"><ClipboardCheck :size="15" /> Start Inspection</RouterLink>
        <RouterLink to="/reports" class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center inline-flex"><FileText :size="15" /> Reports</RouterLink>
        <button class="btn-danger gap-2 text-sm flex-1 sm:flex-none justify-center"><XCircle :size="15" /> Out of Service</button>
      </div>

      <!-- Details grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="(item, i) in details" :key="item.label" class="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-700" :class="{ 'border-r': (i % 3) !== 2 }">
          <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <component :is="item.icon" :size="15" class="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.label }}</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white font-mono">{{ item.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Photos -->
    <div class="card p-5 mb-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Vehicle Photos</h3>
        <button class="btn-secondary gap-1.5 text-xs py-1.5"><Camera :size="13" /> Add Photo</button>
      </div>
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
        <div v-for="(src, i) in photos" :key="i" class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity">
          <img :src="src" alt="" class="w-full h-full object-cover" />
        </div>
        <div class="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <Camera :size="18" class="text-gray-400 mb-1" />
          <span class="text-[10px] text-gray-400">Add</span>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-5">
      <!-- Inspection history -->
      <div class="card">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Inspection History</h3>
          <RouterLink to="/reports" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">View all <ChevronRight :size="12" /></RouterLink>
        </div>
        <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <div v-for="h in inspHistory" :key="h.date" class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div class="w-2 h-2 rounded-full flex-shrink-0" :class="h.status === 'pass' ? 'bg-green-500' : 'bg-red-500'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ h.type }}</p>
              <p class="text-xs text-gray-400">{{ h.date }} · {{ h.driver }}</p>
            </div>
            <span v-if="h.issues > 0" class="badge-red">{{ h.issues }} issues</span>
            <span :class="h.status === 'pass' ? 'badge-green' : 'badge-red'">{{ h.status === 'pass' ? 'Pass' : 'Fail' }}</span>
          </div>
        </div>
      </div>

      <!-- Repair history -->
      <div class="card">
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Repair History</h3>
          <RouterLink to="/repairs" class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">View all <ChevronRight :size="12" /></RouterLink>
        </div>
        <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <div v-for="r in repairHistory" :key="r.issue" class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ r.issue }}</p>
              <p class="text-xs text-gray-400">{{ r.date }}</p>
            </div>
            <span :class="r.priority === 'high' ? 'badge-red' : r.priority === 'medium' ? 'badge-orange' : 'badge-gray'">{{ r.priority }}</span>
            <span class="badge-green">Done</span>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ArrowLeft, Edit, ClipboardCheck, FileText, XCircle, Camera, Fuel, Gauge, Calendar, User, MapPin, Hash, ChevronRight } from 'lucide-vue-next'
import AppLayout from '../components/layout/AppLayout.vue'

const details = [
  { icon: Hash, label: 'VIN', value: '1XKAD49X1EJ301042' },
  { icon: MapPin, label: 'License Plate', value: 'ABC-1234' },
  { icon: Calendar, label: 'Year', value: '2022' },
  { icon: Gauge, label: 'Odometer', value: '125,847 mi' },
  { icon: Fuel, label: 'Engine Hours', value: '3,214 hrs' },
  { icon: User, label: 'Assigned Driver', value: 'John Smith' },
]

const photos = [
  'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?w=150',
  'https://images.pexels.com/photos/6873111/pexels-photo-6873111.jpeg?w=150',
  'https://images.pexels.com/photos/5025642/pexels-photo-5025642.jpeg?w=150',
  'https://images.pexels.com/photos/9463534/pexels-photo-9463534.jpeg?w=150',
]

const inspHistory = [
  { date: 'Today 7:24 AM', type: 'Pre-Trip', driver: 'John Smith', status: 'pass', issues: 0 },
  { date: 'Yesterday 6:15 PM', type: 'Post-Trip', driver: 'John Smith', status: 'pass', issues: 0 },
  { date: 'May 11, 7:02 AM', type: 'Pre-Trip', driver: 'John Smith', status: 'fail', issues: 2 },
  { date: 'May 10, 6:45 PM', type: 'Post-Trip', driver: 'John Smith', status: 'pass', issues: 0 },
  { date: 'May 10, 7:15 AM', type: 'Pre-Trip', driver: 'John Smith', status: 'pass', issues: 0 },
]

const repairHistory = [
  { date: 'May 8', issue: 'Left rear tire pressure', priority: 'medium' },
  { date: 'Apr 28', issue: 'Windshield wiper replacement', priority: 'low' },
  { date: 'Apr 10', issue: 'Brake pad inspection', priority: 'high' },
]
</script>
