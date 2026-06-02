<template>
  <!-- Non-modal: full page with layout -->
  <AppLayout v-if="!isModalInspection" :title="inspectionType === 'post-trip' ? store.t('postTripInspection') : store.t('preTripInspection')">
    <RouterLink to="/driver" class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors">
      <ArrowLeft :size="16" /> {{ store.t('back') }}
    </RouterLink>
    <!-- Vehicle & info strip -->
    <div class="card p-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('vehicle') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ vehicleLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('driver') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ driverLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('dateLabel') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ inspectionDateLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('odometer') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ odometerLabel }}</span>
      </div>
    </div>
    <div class="card p-4 mb-4">
      <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Odometer reading</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">Last odometer: {{ lastOdometerLabel }}</p>
      </div>
      <div class="relative mb-4">
        <input :value="odometerInput" type="text" inputmode="numeric" autocomplete="off" class="input-field pr-16" placeholder="Enter current odometer" @input="onOdometerInput" @blur="validateOdometer(false)" />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 uppercase">{{ odometerUnit }}</span>
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Whole numbers only. The value cannot be less than the last odometer.</p>
      <p v-if="odometerError" class="mt-2 text-xs text-red-500 dark:text-red-400">{{ odometerError }}</p>
      <div v-if="odometerWarning && !odometerConfirmed" class="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 p-3">
        <p class="text-xs font-medium text-yellow-800 dark:text-yellow-300">⚠️ {{ odometerWarning }}</p>
        <button type="button" class="mt-2 text-xs font-semibold text-yellow-700 dark:text-yellow-400 underline underline-offset-2" @click="odometerConfirmed = true">Yes, the value is correct — confirm</button>
      </div>

      <!-- Engine hours input (only if required by template) -->
      <div v-if="engineHoursRequired" class="mt-6">
        <label class="block text-xs mb-1 font-semibold">Engine hours (for heavy/industrial vehicles)</label>
        <input v-model="engineHoursInput" type="number" min="0" step="1" class="input-field w-full" placeholder="Enter engine hours" />
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">If not applicable, leave blank.</p>
      </div>
    </div>
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
        <button @click="markAllPass" class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border-2 transition-all" :class="allPass ? 'bg-green-500 border-green-500 text-white' : 'border-green-300 text-green-600 dark:border-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'">
          <CheckCheck :size="13" /> {{ store.t('markAllOk') }}
        </button>
      </div>
    </div>
    <div class="card divide-y divide-gray-100 dark:divide-gray-700 mb-4">
      <div v-for="item in items" :key="item.id" class="p-4" :class="validationErrors[item.id] ? 'bg-red-50/60 dark:bg-red-900/10' : ''">
        <div class="flex items-center justify-between gap-3">
          <button type="button" class="flex items-center gap-3 flex-1 min-w-0 text-left" @click="toggleExpanded(item.id)">
            <component :is="item.icon" :size="18" class="flex-shrink-0" :class="item.state === 'pass' ? 'text-green-500' : item.state === 'fail' ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'" />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.title }}</span>
                <span v-if="item.category" class="badge-gray">{{ item.category }}</span>
                <span v-if="item.isRequired" class="badge-blue">Required</span>
                <span v-if="item.requiresPhoto" class="badge-orange">Photo</span>
              </div>
              <p v-if="validationErrors[item.id]" class="text-xs text-red-500 dark:text-red-400 mt-1">{{ validationErrors[item.id] }}</p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ isExpanded(item.id) ? store.t('hideDetails') : store.t('openDetails') }}</p>
            </div>
          </button>
          <div class="flex gap-2 flex-shrink-0">
            <button @click.stop="setState(item, 'pass')" class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2" :class="item.state === 'pass' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-500'"><Check :size="16" /></button>
            <button @click.stop="setState(item, 'fail')" class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2" :class="item.state === 'fail' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-500'"><X :size="16" /></button>
            <button @click.stop="setState(item, 'not_applicable')" class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border-2" :class="item.state === 'not_applicable' ? 'bg-gray-500 border-gray-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-600'">N/A</button>
          </div>
        </div>
        <Transition name="slide">
          <div v-if="isExpanded(item.id)" class="mt-3 ml-7 space-y-3">
            <p v-if="item.description" class="text-sm text-gray-600 dark:text-gray-300">{{ item.description }}</p>
            <div v-if="item.referencePhotoUrl" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{{ store.t('referencePhoto') }}</p>
              <button type="button" class="h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" @click="openPhotoLightbox([item.referencePhotoUrl], 0)">
                <img :src="item.referencePhotoUrl" alt="Reference" class="h-full w-full object-cover" />
              </button>
            </div>
            <textarea v-model="item.comment" :placeholder="item.state === 'fail' ? store.t('describeIssue') : 'Add a comment'" rows="3" class="w-full text-sm input-field resize-none" :class="item.state === 'fail' ? 'placeholder-red-300 dark:placeholder-red-700 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''" />
            <div class="flex items-center gap-3 mt-2">
              <label class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                <Camera :size="13" /> {{ store.t('addPhoto') }}
                <input type="file" accept="image/*" multiple class="sr-only" @change="addPhotos(item, $event)" />
              </label>
              <div v-if="item.photos.length" class="flex gap-1.5">
                <div v-for="(url, pi) in item.photos" :key="pi" class="relative">
                  <button type="button" class="photo-thumb" @click="openPhotoLightbox(item.photos, pi)"><img :src="url" alt="" class="w-full h-full object-cover" /></button>
                  <button type="button" @click.stop="removePhoto(item, pi)" class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white"><X :size="7" /></button>
                </div>
              </div>
            </div>
            <p v-if="item.requiresPhoto" class="text-xs text-gray-500 dark:text-gray-400">{{ store.t('requiresPhotoBeforeSubmit') }}</p>
          </div>
        </Transition>
      </div>
    </div>
    <div class="card p-4 mb-4">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Driver Signature</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">Sign by hand on the screen to submit this inspection.</p>
        </div>
        <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="clearSignature">Clear signature</button>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900/40">
        <canvas ref="signatureCanvas" class="signature-canvas" @pointerdown="startSignature" @pointermove="moveSignature" @pointerup="endSignature" @pointerleave="endSignature" @pointercancel="endSignature" />
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ signatureDataUrl ? 'Signature captured.' : 'No signature yet.' }}</p>
      <p v-if="signatureError" class="mt-2 text-xs text-red-500 dark:text-red-400">{{ signatureError }}</p>
    </div>
    <p v-if="draftMessage" class="mb-3 text-sm text-green-600 dark:text-green-400">{{ draftMessage }}</p>
    <p v-if="submitError" class="mb-3 text-sm text-red-500 dark:text-red-400">{{ submitError }}</p>
    <div class="flex gap-3 pb-4">
      <button class="btn-secondary flex-1 py-3 text-sm" :disabled="savingDraft || submittingInspection" @click="handleSaveDraft">{{ savingDraft ? 'Saving...' : store.t('saveDraft') }}</button>
      <button @click="handleSubmit" class="btn-primary flex-1 py-3 text-sm" :disabled="submittingInspection || savingDraft">{{ submittingInspection ? store.t('submittingInspection') : store.t('submitInspection') }}</button>
    </div>
    <PhotoLightbox v-model="photoLightboxOpen" :photos="lightboxPhotos" :start-index="lightboxStartIndex" />
  </AppLayout>

  <!-- Modal mode: Teleport to body so it truly overlays the full viewport -->
  <Teleport v-else to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div class="flex min-h-full justify-center p-4 py-8">
        <div class="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 p-4">
          <button
            type="button"
            class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
            @click="closeInspectionView"
          >
            <ArrowLeft :size="16" /> {{ store.t('back') }}
          </button>

    <!-- Vehicle & info strip -->
    <div class="card p-4 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('vehicle') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ vehicleLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('driver') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ driverLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('dateLabel') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ inspectionDateLabel }}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">{{ store.t('odometer') }}</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ odometerLabel }}</span>
      </div>
    </div>

    <div class="card p-4 mb-4">
      <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Odometer reading</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Last odometer: {{ lastOdometerLabel }}
        </p>
      </div>
      <div class="relative">
        <input
          :value="odometerInput"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          class="input-field pr-16"
          placeholder="Enter current odometer"
          @input="onOdometerInput"
          @blur="validateOdometer(false)"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 uppercase">
          {{ odometerUnit }}
        </span>
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Whole numbers only. The value cannot be less than the last odometer.
      </p>
      <p v-if="odometerError" class="mt-2 text-xs text-red-500 dark:text-red-400">
        {{ odometerError }}
      </p>
      <div v-if="odometerWarning && !odometerConfirmed" class="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20 p-3">
        <p class="text-xs font-medium text-yellow-800 dark:text-yellow-300">⚠️ {{ odometerWarning }}</p>
        <button type="button" class="mt-2 text-xs font-semibold text-yellow-700 dark:text-yellow-400 underline underline-offset-2" @click="odometerConfirmed = true">Yes, the value is correct — confirm</button>
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
      <div
        v-for="item in items"
        :key="item.id"
        class="p-4"
        :class="validationErrors[item.id] ? 'bg-red-50/60 dark:bg-red-900/10' : ''"
      >
        <div class="flex items-center justify-between gap-3">
          <button
            type="button"
            class="flex items-center gap-3 flex-1 min-w-0 text-left"
            @click="toggleExpanded(item.id)"
          >
            <component :is="item.icon" :size="18" class="flex-shrink-0"
              :class="item.state === 'pass' ? 'text-green-500' : item.state === 'fail' ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'" />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.title }}</span>
                <span v-if="item.category" class="badge-gray">{{ item.category }}</span>
                <span v-if="item.isRequired" class="badge-blue">Required</span>
                <span v-if="item.requiresPhoto" class="badge-orange">Photo</span>
              </div>
              <p v-if="validationErrors[item.id]" class="text-xs text-red-500 dark:text-red-400 mt-1">
                {{ validationErrors[item.id] }}
              </p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ isExpanded(item.id) ? store.t('hideDetails') : store.t('openDetails') }}
              </p>
            </div>
          </button>
          <div class="flex gap-2 flex-shrink-0">
            <button @click.stop="setState(item, 'pass')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'pass' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-500'">
              <Check :size="16" />
            </button>
            <button @click.stop="setState(item, 'fail')"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2"
              :class="item.state === 'fail' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-red-400 hover:text-red-500'">
              <X :size="16" />
            </button>
            <button @click.stop="setState(item, 'not_applicable')"
              class="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border-2"
              :class="item.state === 'not_applicable' ? 'bg-gray-500 border-gray-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-600'">
              N/A
            </button>
          </div>
        </div>

        <Transition name="slide">
          <div v-if="isExpanded(item.id)" class="mt-3 ml-7 space-y-3">
            <p v-if="item.description" class="text-sm text-gray-600 dark:text-gray-300">
              {{ item.description }}
            </p>
            <div v-if="item.referencePhotoUrl" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-2">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{{ store.t('referencePhoto') }}</p>
              <button type="button" class="h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700" @click="openPhotoLightbox([item.referencePhotoUrl], 0)">
                <img :src="item.referencePhotoUrl" alt="Reference" class="h-full w-full object-cover" />
              </button>
            </div>

            <textarea
              v-model="item.comment"
              :placeholder="item.state === 'fail' ? store.t('describeIssue') : 'Add a comment'"
              rows="3"
              class="w-full text-sm input-field resize-none"
              :class="item.state === 'fail' ? 'placeholder-red-300 dark:placeholder-red-700 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''"
            />
            <div class="flex items-center gap-3 mt-2">
              <label class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                <Camera :size="13" /> {{ store.t('addPhoto') }}
                <input type="file" accept="image/*" multiple class="sr-only" @change="addPhotos(item, $event)" />
              </label>
              <div v-if="item.photos.length" class="flex gap-1.5">
                <div v-for="(url, pi) in item.photos" :key="pi" class="relative">
                  <button
                    type="button"
                    class="photo-thumb"
                    @click="openPhotoLightbox(item.photos, pi)"
                  >
                    <img :src="url" alt="" class="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    @click.stop="removePhoto(item, pi)"
                    class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-white"
                  >
                    <X :size="7" />
                  </button>
                </div>
              </div>
            </div>
            <p v-if="item.requiresPhoto" class="text-xs text-gray-500 dark:text-gray-400">
              {{ store.t('requiresPhotoBeforeSubmit') }}
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <div class="card p-4 mb-4">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Driver Signature</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">Sign by hand on the screen to submit this inspection.</p>
        </div>
        <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="clearSignature">
          Clear signature
        </button>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900/40">
        <canvas
          ref="signatureCanvas"
          class="signature-canvas"
          @pointerdown="startSignature"
          @pointermove="moveSignature"
          @pointerup="endSignature"
          @pointerleave="endSignature"
          @pointercancel="endSignature"
        />
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ signatureDataUrl ? 'Signature captured.' : 'No signature yet.' }}
      </p>
      <p v-if="signatureError" class="mt-2 text-xs text-red-500 dark:text-red-400">
        {{ signatureError }}
      </p>
    </div>

    <!-- Submit -->
    <p v-if="draftMessage" class="mb-3 text-sm text-green-600 dark:text-green-400">
      {{ draftMessage }}
    </p>
    <p v-if="submitError" class="mb-3 text-sm text-red-500 dark:text-red-400">
      {{ submitError }}
    </p>
    <div class="flex gap-3 pb-4">
      <button
        class="btn-secondary flex-1 py-3 text-sm"
        :disabled="savingDraft || submittingInspection"
        @click="handleSaveDraft"
      >
        {{ savingDraft ? 'Saving...' : store.t('saveDraft') }}
      </button>
      <button @click="handleSubmit" class="btn-primary flex-1 py-3 text-sm" :disabled="submittingInspection || savingDraft">{{ submittingInspection ? store.t('submittingInspection') : store.t('submitInspection') }}</button>
    </div>

        <PhotoLightbox
          v-model="photoLightboxOpen"
          :photos="lightboxPhotos"
          :start-index="lightboxStartIndex"
        />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Camera, Check, CheckCheck, X, FileText } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { useDriverVehicleStore } from '@/stores/driverVehicleStore'
import { supabase } from '@/lib/supabase'
import AppLayout from '../components/layout/AppLayout.vue'
import PhotoLightbox from '@/components/shared/PhotoLightbox.vue'
import { formatDateTime } from '@/lib/dateFormat'
import { readSignatureFallback, readSignatureFallbackFromDb } from '@/lib/signatureFallback'
import { analyzeAndStoreInspectionPhotos } from '@/lib/photoFraud'
import { normalizePhotoUrls } from '@/lib/photoUrls'

function isMissingSignatureColumnsError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return (
    value.includes('signature_data_url') ||
    value.includes('signed_at') ||
    value.includes('signed_by_driver_id')
  )
}

const props = defineProps<{ isPostTrip?: boolean }>()
const store = useAppStore()
const vehicleStore = useDriverVehicleStore()
const router = useRouter()
const route = useRoute()

type State = 'pass' | 'fail' | 'not_applicable' | null
interface Item {
  id: string
  title: string
  description: string | null
  referencePhotoUrl: string | null
  category: string | null
  categorySeverity: 'low' | 'medium' | 'high'
  isRequired: boolean
  requiresPhoto: boolean
  sortOrder: number
  icon: unknown
  state: State
  comment: string
  photos: string[]
}

interface UploadedPhotoMeta {
  dataUrl: string
  fileName: string | null
  fileSizeBytes: number | null
  mimeType: string | null
  uploadedAt: string
}

const inspection = ref<any | null>(null)
const items = reactive<Item[]>([])
const expandedIds = ref<Set<string>>(new Set())
const validationErrors = ref<Record<string, string>>({})
const savingDraft = ref(false)
const submittingInspection = ref(false)
const draftMessage = ref('')
const photoLightboxOpen = ref(false)
const lightboxPhotos = ref<string[]>([])
const lightboxStartIndex = ref(0)
const photoMetaByItemId = ref<Record<string, UploadedPhotoMeta[]>>({})
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const signatureDataUrl = ref('')
const signatureError = ref('')
const odometerInput = ref('')
const odometerError = ref('')
const odometerWarning = ref('')
const odometerConfirmed = ref(false)
const latestCommittedOdometer = ref<number | null>(null)
const historicalMaxOdometer = ref<number | null>(null)
const initialInspectionOdometer = ref<number | null>(null)
const submitError = ref('')
const isSignatureDrawing = ref(false)
const signatureLastPoint = ref<{ x: number; y: number } | null>(null)
const engineHoursInput = ref('')
const engineHoursRequired = ref(false)

const isModalInspection = computed(() => String(route.query.modal || '') === '1')

onMounted(async () => {
  await loadInspectionItems()
  await nextTick()
  initializeSignatureCanvas()
  window.addEventListener('resize', handleSignatureResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleSignatureResize)
})

const inspectionType = computed<'pre-trip' | 'post-trip'>(() =>
  inspection.value?.type === 'post-trip' || props.isPostTrip ? 'post-trip' : 'pre-trip'
)

function setState(item: Item, s: State) {
  item.state = item.state === s ? null : s
  delete validationErrors.value[item.id]
}

function toggleExpanded(itemId: string) {
  const next = new Set(expandedIds.value)
  if (next.has(itemId)) next.delete(itemId)
  else next.add(itemId)
  expandedIds.value = next
}

function isExpanded(itemId: string) {
  return expandedIds.value.has(itemId)
}

async function addPhotos(item: Item, event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  const uploadedAt = new Date().toISOString()
  const urls = await Promise.all(files.map(readFileAsDataUrl))
  const nextMeta = files.map((file, index) => ({
    dataUrl: urls[index],
    fileName: file.name || null,
    fileSizeBytes: Number.isFinite(file.size) ? file.size : null,
    mimeType: file.type || null,
    uploadedAt,
  }))

  item.photos.push(...urls)
  const existingMeta = photoMetaByItemId.value[item.id] || []
  photoMetaByItemId.value[item.id] = [...existingMeta, ...nextMeta]
  delete validationErrors.value[item.id]
  input.value = ''
}

function removePhoto(item: Item, index: number) {
  item.photos.splice(index, 1)
  const metadata = photoMetaByItemId.value[item.id] || []
  metadata.splice(index, 1)
  photoMetaByItemId.value[item.id] = metadata
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function openPhotoLightbox(photos: string[] | null | undefined, index = 0) {
  const cleanPhotos = (photos || []).filter(Boolean)
  if (!cleanPhotos.length) return
  lightboxPhotos.value = cleanPhotos
  lightboxStartIndex.value = index
  photoLightboxOpen.value = true
}

function markAllPass() {
  items.forEach(i => { i.state = 'pass' })
}

function initializeSignatureCanvas() {
  const canvas = signatureCanvas.value
  if (!canvas) return

  const currentDataUrl = signatureDataUrl.value
  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1

  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(180 * ratio))
  canvas.style.height = '180px'

  const context = canvas.getContext('2d')
  if (!context) return

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(ratio, ratio)
  paintSignatureCanvasBackground(context, rect.width, 180)

  if (currentDataUrl) {
    drawSignatureFromDataUrl(currentDataUrl)
  }
}

function handleSignatureResize() {
  initializeSignatureCanvas()
}

function paintSignatureCanvasBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  context.strokeStyle = '#e5e7eb'
  context.lineWidth = 1
  context.setLineDash([6, 6])
  context.beginPath()
  context.moveTo(12, height - 24)
  context.lineTo(width - 12, height - 24)
  context.stroke()
  context.setLineDash([])
}

function getCanvasPoint(event: PointerEvent) {
  const canvas = signatureCanvas.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startSignature(event: PointerEvent) {
  if (!signatureCanvas.value) return
  signatureCanvas.value.setPointerCapture(event.pointerId)
  isSignatureDrawing.value = true
  signatureLastPoint.value = getCanvasPoint(event)
  signatureError.value = ''
}

function moveSignature(event: PointerEvent) {
  if (!isSignatureDrawing.value || !signatureCanvas.value) return

  const context = signatureCanvas.value.getContext('2d')
  const nextPoint = getCanvasPoint(event)
  const lastPoint = signatureLastPoint.value
  if (!context || !nextPoint || !lastPoint) return

  context.strokeStyle = '#0f172a'
  context.lineWidth = 2.1
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.beginPath()
  context.moveTo(lastPoint.x, lastPoint.y)
  context.lineTo(nextPoint.x, nextPoint.y)
  context.stroke()

  signatureLastPoint.value = nextPoint
}

function endSignature(event: PointerEvent) {
  if (!isSignatureDrawing.value) return

  isSignatureDrawing.value = false
  signatureLastPoint.value = null

  if (!signatureCanvas.value) return

  try {
    signatureCanvas.value.releasePointerCapture(event.pointerId)
  } catch {
    // ignore pointer capture mismatch
  }

  signatureDataUrl.value = signatureCanvas.value.toDataURL('image/png')
}

function clearSignature() {
  signatureDataUrl.value = ''
  signatureError.value = ''
  initializeSignatureCanvas()
}

function drawSignatureFromDataUrl(value: string) {
  const canvas = signatureCanvas.value
  if (!canvas || !value) return

  const context = canvas.getContext('2d')
  if (!context) return

  const image = new Image()
  image.onload = () => {
    const width = canvas.getBoundingClientRect().width
    const height = 180
    paintSignatureCanvasBackground(context, width, height)
    context.drawImage(image, 0, 0, width, height)
  }
  image.src = value
}

async function loadInspectionItems() {
  const inspectionId = String(route.query.inspectionId || '')
  if (!inspectionId) return

  let { data: inspectionData, error: inspectionError } = await supabase
    .from('inspections')
    .select(`
      id,
      company_id,
      type,
      status,
      created_at,
      signature_data_url,
      odometer,
      vehicle_id,
      driver_id,
      vehicles (
        unit,
        make,
        model,
        odometer,
        odometer_unit
      ),
      drivers!inspections_driver_id_fkey (
        name
      )
    `)
    .eq('id', inspectionId)
    .single()

  if (inspectionError && isMissingSignatureColumnsError(inspectionError.message)) {
    const retry = await supabase
      .from('inspections')
      .select(`
        id,
        company_id,
        type,
        status,
        created_at,
        odometer,
        vehicle_id,
        driver_id,
        vehicles (
          unit,
          make,
          model,
          odometer,
          odometer_unit
        ),
        drivers!inspections_driver_id_fkey (
          name
        )
      `)
      .eq('id', inspectionId)
      .single()
    inspectionData = retry.data as any
    inspectionError = retry.error
  }

  if (!inspectionError) {
    inspection.value = inspectionData
    initialInspectionOdometer.value =
      inspectionData?.odometer != null && Number.isFinite(Number(inspectionData.odometer))
        ? Number(inspectionData.odometer)
        : null
    const localFallbackSignature = readSignatureFallback(inspectionId)
    const fallbackSignature =
      localFallbackSignature || (await readSignatureFallbackFromDb(inspectionId))
    signatureDataUrl.value = inspectionData?.signature_data_url || fallbackSignature?.dataUrl || ''
    odometerInput.value =
      inspectionData?.odometer != null ? String(Math.trunc(Number(inspectionData.odometer))) : ''
    latestCommittedOdometer.value = await fetchLatestCommittedOdometer(
      inspectionData?.vehicle_id,
      inspectionData?.id
    )
    historicalMaxOdometer.value = await fetchMaxHistoricalOdometer(
      inspectionData?.vehicle_id,
      inspectionData?.id
    )

    const vehicle = Array.isArray(inspectionData?.vehicles)
      ? inspectionData.vehicles[0]
      : inspectionData?.vehicles
    const vehicleOdometer = vehicle?.odometer != null ? Number(vehicle.odometer) : null
    const baselineValues = [
      latestCommittedOdometer.value,
      historicalMaxOdometer.value,
      vehicleOdometer,
      initialInspectionOdometer.value,
    ].filter((value): value is number => Number.isFinite(value))
    const baselineOdometer = baselineValues.length ? Math.max(...baselineValues) : null

    if (baselineOdometer != null) {
      const currentDraftValue = odometerInput.value ? Number(odometerInput.value) : null
      const normalized =
        Number.isFinite(currentDraftValue) && (currentDraftValue as number) > baselineOdometer
          ? (currentDraftValue as number)
          : baselineOdometer
      odometerInput.value = String(Math.trunc(normalized))
    }
  }

  const { data, error } = await supabase
    .from('inspection_results')
    .select(`
      id,
      result,
      comment,
      photo_urls,
      inspection_template_items (
        title,
        description,
        reference_photo_url,
        category_id,
        inspection_item_categories (
          id,
          name,
          severity
        ),
        is_required,
        requires_photo,
        sort_order
      )
    `)
    .eq('inspection_id', inspectionId)

  if (error || !data?.length) return

  const fallbackUploadedAt = inspectionData?.created_at || new Date().toISOString()
  const metadataSeed: Record<string, UploadedPhotoMeta[]> = {}
  const mappedItems = data.map((result: any) => {
    const loadedPhotos = normalizePhotoUrls(result.photo_urls)

    metadataSeed[result.id] = loadedPhotos.map((dataUrl: string) => ({
      dataUrl,
      fileName: null,
      fileSizeBytes: null,
      mimeType: null,
      uploadedAt: fallbackUploadedAt,
    }))

    return {
      id: result.id,
      title: result.inspection_template_items?.title || 'Checklist item',
      description: result.inspection_template_items?.description || null,
      referencePhotoUrl: result.inspection_template_items?.reference_photo_url || null,
      category: result.inspection_template_items?.inspection_item_categories?.name || null,
      categorySeverity:
        result.inspection_template_items?.inspection_item_categories?.severity || 'medium',
      isRequired: Boolean(result.inspection_template_items?.is_required),
      requiresPhoto: Boolean(result.inspection_template_items?.requires_photo),
      sortOrder: result.inspection_template_items?.sort_order || 0,
      icon: FileText,
      state: ['pass', 'fail', 'not_applicable'].includes(result.result) ? result.result : null,
      comment: result.comment || '',
      photos: loadedPhotos,
    }
  })

  items.splice(0, items.length, ...mappedItems.sort((a: Item, b: Item) => a.sortOrder - b.sortOrder))
  photoMetaByItemId.value = metadataSeed
}

const allPass  = computed(() => items.every(i => i.state === 'pass'))
const doneCount = computed(() => items.filter(i => i.state !== null).length)
const passCount = computed(() => items.filter(i => i.state === 'pass').length)
const failCount = computed(() => items.filter(i => i.state === 'fail').length)
const progress  = computed(() => items.length ? Math.round((doneCount.value / items.length) * 100) : 0)
const vehicleLabel = computed(() => {
  const vehicle = Array.isArray(inspection.value?.vehicles)
    ? inspection.value.vehicles[0]
    : inspection.value?.vehicles
  const name = `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim()
  return [name, vehicle?.unit ? `#${vehicle.unit}` : ''].filter(Boolean).join(' · ') || '—'
})
const driverLabel = computed(() => {
  const driver = Array.isArray(inspection.value?.drivers)
    ? inspection.value.drivers[0]
    : inspection.value?.drivers
  return driver?.name || '—'
})
const inspectionDateLabel = computed(() =>
  formatDateTime(inspection.value?.created_at, store.language)
)
const odometerLabel = computed(() => {
  const vehicle = Array.isArray(inspection.value?.vehicles)
    ? inspection.value.vehicles[0]
    : inspection.value?.vehicles
  const value = inspection.value?.odometer ?? vehicle?.odometer
  const unit = vehicle?.odometer_unit || 'mi'
  return value != null ? `${Number(value).toLocaleString()} ${unit}` : '—'
})

const odometerUnit = computed(() => {
  const vehicle = Array.isArray(inspection.value?.vehicles)
    ? inspection.value.vehicles[0]
    : inspection.value?.vehicles
  return vehicle?.odometer_unit || 'mi'
})

const lastOdometerValue = computed<number | null>(() => {
  const vehicle = Array.isArray(inspection.value?.vehicles)
    ? inspection.value.vehicles[0]
    : inspection.value?.vehicles

  const committed = latestCommittedOdometer.value
  const historical = historicalMaxOdometer.value
  const vehicleOdometer = vehicle?.odometer != null ? Number(vehicle.odometer) : null
  const values = [committed, historical, vehicleOdometer].filter(
    (value): value is number => Number.isFinite(value)
  )

  return values.length ? Math.max(...values) : null
})

const minAllowedOdometer = computed<number | null>(() => {
  const values = [lastOdometerValue.value, initialInspectionOdometer.value].filter(
    (value): value is number => Number.isFinite(value)
  )
  return values.length ? Math.max(...values) : null
})

const lastOdometerLabel = computed(() =>
  lastOdometerValue.value != null
    ? `${Number(lastOdometerValue.value).toLocaleString()} ${odometerUnit.value}`
    : `— ${odometerUnit.value}`
)

function parseOdometerInput() {
  if (!odometerInput.value) return null
  const value = Number(odometerInput.value)
  if (!Number.isInteger(value) || value < 0) return null
  return value
}

function onOdometerInput(event: Event) {
  const target = event.target as HTMLInputElement
  const sanitized = target.value.replace(/\D/g, '')
  odometerInput.value = sanitized
  if (target.value !== sanitized) target.value = sanitized
  odometerError.value = ''
  odometerWarning.value = ''
  odometerConfirmed.value = false
}

function validateOdometer(requireValue: boolean) {
  const parsed = parseOdometerInput()

  if (!odometerInput.value) {
    if (requireValue) {
      odometerError.value = 'Odometer is required.'
      return false
    }
    odometerError.value = ''
    return true
  }

  if (parsed == null) {
    odometerError.value = 'Use whole numbers only.'
    return false
  }

  const minimum = minAllowedOdometer.value
  if (minimum != null && parsed < minimum) {
    odometerError.value = `Odometer cannot be lower than ${minimum}.`
    return false
  }

  // Large-jump warning: > 1000 units above known baseline (last reading / draft baseline)
  const baseline = minAllowedOdometer.value
  if (baseline != null && parsed - baseline > 1000) {
    odometerWarning.value = `The odometer increased by more than 1000 ${odometerUnit.value} since the last reading (${baseline.toLocaleString()} ${odometerUnit.value}). Please verify - this exceeds the typical daily limit.`
    if (!odometerConfirmed.value) return false
  } else {
    odometerWarning.value = ''
  }

  odometerError.value = ''
  return true
}

async function validateOdometerJumpOnSubmit(vehicleId: string, inspectionId: string) {
  const parsed = parseOdometerInput()
  if (parsed == null) return true

  const floor = await vehicleStore.fetchVehicleOdometerFloor(vehicleId, inspectionId)
  if (floor == null) return true

  if (parsed - floor > 1000) {
    odometerWarning.value = `The odometer increased by more than 1000 ${odometerUnit.value} since the last reading (${floor.toLocaleString()} ${odometerUnit.value}). Please verify - this exceeds the typical daily limit.`
    if (!odometerConfirmed.value) {
      nextTick(() => {
        document.querySelector<HTMLElement>('.input-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      return false
    }
  }

  return true
}

async function runPhotoFraudAnalysis(inspectionId: string) {
  const companyId = inspection.value?.company_id
  if (!companyId) return

  const photos = items.flatMap((item) => {
    const metadata = photoMetaByItemId.value[item.id] || []
    return item.photos
      .filter(Boolean)
      .map((dataUrl, photoIndex) => {
        const meta = metadata[photoIndex]
        return {
          inspectionResultId: item.id,
          photoIndex,
          dataUrl,
          fileName: meta?.fileName || null,
          fileSizeBytes: meta?.fileSizeBytes ?? null,
          mimeType: meta?.mimeType || null,
          uploadedAt: meta?.uploadedAt || new Date().toISOString(),
        }
      })
  })

  if (!photos.length) return

  await analyzeAndStoreInspectionPhotos({
    companyId,
    inspectionId,
    driverId: inspection.value?.driver_id || null,
    vehicleId: inspection.value?.vehicle_id || null,
    inspectionCreatedAt: inspection.value?.created_at || null,
    photos,
  })
}

function closeInspectionView() {
  if (isModalInspection.value) {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push('/driver/vehicles')
    return
  }
  router.push('/driver')
}

async function handleSubmit() {
  if (submittingInspection.value) return

  const inspectionId = String(route.query.inspectionId || '')
  const vehicleId = String(route.query.vehicleId || '')
  submitError.value = ''
  submittingInspection.value = true

  try {
    if (inspectionId && vehicleId) {
      if (!signatureDataUrl.value) {
        signatureError.value = 'Driver signature is required before submit.'
        return
      }
      if (!validateOdometer(true)) return
      if (!await validateOdometerJumpOnSubmit(vehicleId, inspectionId)) return
      if (!validateInspection()) return
      const odometerReading = parseOdometerInput()
      await saveInspectionResults()
      await createIssuesForFailedResults(inspectionId)

      const completed = await vehicleStore.completeInspection(
        inspectionId,
        vehicleId,
        inspectionType.value,
        failCount.value > 0,
        signatureDataUrl.value,
        odometerReading
      )

      if (!completed) {
        const errMsg = vehicleStore.error || 'Inspection could not be completed. Please try again.'
        if (errMsg.toLowerCase().includes('odometer')) {
          odometerError.value = errMsg
          nextTick(() => {
            document.querySelector<HTMLElement>('.input-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          })
        } else {
          submitError.value = errMsg
        }
        return
      }

      try {
        await runPhotoFraudAnalysis(inspectionId)
      } catch (fraudError) {
        // Anti-fraud must not block report submission, but the error is logged for diagnostics.
        console.warn('[PreTripInspection] photo fraud analysis failed', fraudError)
      }
    }

    store.setInspectionResult(failCount.value > 0 ? 'fail' : 'pass')
    router.push(inspectionId ? `/inspect/result?inspectionId=${inspectionId}` : '/inspect/result')
  } finally {
    submittingInspection.value = false
  }
}

async function handleSaveDraft() {
  const inspectionId = String(route.query.inspectionId || '')
  if (!inspectionId) return

  savingDraft.value = true
  draftMessage.value = ''
  submitError.value = ''

  try {
    if (!validateOdometer(false)) return
    const vehicleId = String(route.query.vehicleId || '')
    if (vehicleId && !await validateOdometerJumpOnSubmit(vehicleId, inspectionId)) return
    await saveInspectionResults()
    const draftOdometer = parseOdometerInput()
    const { error } = await supabase
      .from('inspections')
      .update({
        status: 'draft',
        odometer: draftOdometer,
      })
      .eq('id', inspectionId)

    if (error) throw error
    draftMessage.value = 'Draft saved.'
    window.setTimeout(() => {
      router.push('/driver/reports')
    }, 500)
  } catch (error) {
    console.error('[PreTripInspection] failed to save draft', error)
    draftMessage.value = 'Draft could not be saved.'
  } finally {
    savingDraft.value = false
  }
}

async function fetchLatestCommittedOdometer(vehicleId?: string, currentInspectionId?: string) {
  if (!vehicleId) return null

  let query = supabase
    .from('inspections')
    .select('odometer, submitted_at, created_at')
    .eq('vehicle_id', vehicleId)
    .in('status', ['submitted', 'approved', 'needs-review', 'rejected'])
    .not('odometer', 'is', null)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (currentInspectionId) {
    query = query.neq('id', currentInspectionId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('[PreTripInspection] failed to load last odometer', error)
    return null
  }

  return data?.odometer != null ? Number(data.odometer) : null
}

async function fetchMaxHistoricalOdometer(vehicleId?: string, currentInspectionId?: string) {
  if (!vehicleId) return null

  let query = supabase
    .from('inspections')
    .select('odometer')
    .eq('vehicle_id', vehicleId)
    .not('odometer', 'is', null)
    .order('odometer', { ascending: false })
    .limit(1)

  if (currentInspectionId) {
    query = query.neq('id', currentInspectionId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('[PreTripInspection] failed to load max odometer', error)
    return null
  }

  return data?.odometer != null ? Number(data.odometer) : null
}

function validateInspection() {
  const errors: Record<string, string> = {}

  for (const item of items) {
    if (item.isRequired && !item.state) {
      errors[item.id] = 'Select a result for this required item.'
    } else if (item.requiresPhoto && item.photos.length === 0) {
      errors[item.id] = 'Upload at least one photo for this item.'
    }
  }

  validationErrors.value = errors
  const firstInvalidId = Object.keys(errors)[0]
  if (firstInvalidId) {
    const next = new Set(expandedIds.value)
    next.add(firstInvalidId)
    expandedIds.value = next
    return false
  }

  return true
}

async function saveInspectionResults() {
  const rows = items
    .filter((item) => item.id)
    .map((item) =>
      supabase
        .from('inspection_results')
        .update({
          result: item.state,
          comment: item.comment || null,
          photo_urls: item.photos,
        })
        .eq('id', item.id)
    )

  const results = await Promise.all(rows)
  const failed = results.find((result) => result.error)
  if (failed?.error) throw failed.error
}

async function createIssuesForFailedResults(inspectionId: string) {
  const failedItems = items.filter((item) => item.state === 'fail')
  if (!failedItems.length || !inspection.value) return

  const rows = failedItems.map((item) => ({
    company_id: inspection.value.company_id,
    vehicle_id: inspection.value.vehicle_id,
    driver_id: inspection.value.driver_id,
    inspection_id: inspectionId,
    inspection_result_id: item.id,
    status: 'under-review',
    severity: item.categorySeverity || 'medium',
    photo_urls: item.photos,
    title: item.title,
    description: item.comment || item.description || item.title,
  }))

  const { error } = await supabase
    .from('issues')
    .upsert(rows, { onConflict: 'inspection_result_id' })
  if (error) {
    console.error('[PreTripInspection] failed to create inspection issues', error)
  }
}

</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
.photo-thumb {
  @apply w-10 h-10 rounded-lg overflow-hidden border border-red-200 bg-red-50 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:opacity-90 dark:border-red-800 dark:bg-red-900/10;
}

.signature-canvas {
  @apply block w-full rounded-lg;
  height: 180px;
  touch-action: none;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}
</style>
