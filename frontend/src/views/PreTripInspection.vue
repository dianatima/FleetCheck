<template>
  <AppLayout :title="isPostTrip ? store.t('postTripInspection') : store.t('preTripInspection')">
    <div class="pointer-events-none fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm" />

    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div class="pointer-events-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-gray-900">
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{{ workflowCopy.guidedInspection }}</p>
              <h2 class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {{ localizedActiveTemplateName || (props.isPostTrip ? store.t('postTripInspection') : store.t('preTripInspection')) }}
              </h2>
              <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span class="badge-blue">{{ tripTypeBadgeLabel }}</span>
                <span v-if="selectedVehicle" class="badge-gray">{{ selectedVehicle.make }} {{ selectedVehicle.model }} · #{{ selectedVehicle.unit }}</span>
                <span class="badge-gray">{{ inspectionDateLabel }}</span>
                <span v-if="localizedActiveTemplateVehicleType" class="badge-gray">{{ localizedActiveTemplateVehicleType }}</span>
              </div>
            </div>

            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-500 dark:hover:border-gray-600 dark:hover:text-gray-200"
              @click="closeInspection"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{{ currentStepLabel }}</span>
              <span>{{ wizardStepProgress }}% {{ workflowCopy.workflow }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div class="h-full rounded-full bg-blue-500 transition-all duration-300" :style="{ width: `${wizardStepProgress}%` }" />
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-5 sm:p-6">
          <div v-if="visibleTemplateError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {{ visibleTemplateError }}
          </div>

          <div v-if="submitError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {{ submitError }}
          </div>

          <template v-if="isSetupStep">
            <div class="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <section class="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-950/40">
                <div class="mb-5">
                  <p class="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{{ workflowCopy.stepOne }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ workflowCopy.inspectionSetup }}</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ workflowCopy.inspectionSetupDescription }}</p>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <div class="md:col-span-2">
                    <label class="label">{{ store.t('vehicle') }}</label>
                    <select
                      v-model="selectedVehicleId"
                      class="input-field"
                      :class="setupFieldErrors.vehicle ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-700' : ''"
                      :disabled="vehiclesLoading || availableVehicles.length === 0"
                      @change="handleVehicleChange"
                    >
                      <option v-for="vehicle in availableVehicles" :key="vehicle.id" :value="vehicle.id">{{ formatVehicleOption(vehicle) }}</option>
                    </select>
                    <p v-if="setupFieldErrors.vehicle" class="mt-2 text-xs text-red-600 dark:text-red-300">{{ setupFieldErrors.vehicle }}</p>
                  </div>

                  <div class="md:col-span-2">
                    <label class="label">{{ workflowCopy.matchedInspectionTemplate }}</label>
                    <div class="rounded-2xl border bg-white px-4 py-3 text-sm dark:bg-gray-950" :class="templateSelectionError || setupFieldErrors.template ? 'border-red-200 dark:border-red-900/60' : 'border-gray-200 dark:border-gray-700'">
                      <p v-if="activeTemplateName" class="font-semibold text-gray-900 dark:text-white">{{ localizedActiveTemplateName }}</p>
                      <p v-else class="font-medium text-red-600 dark:text-red-300">{{ workflowCopy.noActiveTemplateAssigned }}</p>
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {{ activeTemplateName
                          ? workflowCopy.appliedAutomatically(localizedActiveTemplateVehicleType || activeTemplateVehicleType, tripTypeBadgeLabel)
                          : workflowCopy.adminMustCreateTemplate(tripTypeBadgeLabel) }}
                      </p>
                    </div>
                    <p v-if="setupFieldErrors.template && setupFieldErrors.template !== templateSelectionError" class="mt-2 text-xs text-red-600 dark:text-red-300">{{ setupFieldErrors.template }}</p>
                  </div>

                  <div>
                    <label class="label">{{ workflowCopy.currentOdometer }} ({{ activeDistanceUnit }})</label>
                    <input v-model.number="currentOdometer" type="number" min="0" step="0.1" class="input-field" :class="setupFieldErrors.odometer ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-700' : ''" />
                    <p v-if="setupFieldErrors.odometer" class="mt-2 text-xs text-red-600 dark:text-red-300">{{ setupFieldErrors.odometer }}</p>
                  </div>

                  <div>
                    <label class="label">{{ workflowCopy.currentEngineHours }}</label>
                    <input v-model.number="currentEngineHours" type="number" min="0" step="0.1" class="input-field" :class="setupFieldErrors.engineHours ? 'border-red-300 focus:border-red-400 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-700' : ''" />
                    <p v-if="setupFieldErrors.engineHours" class="mt-2 text-xs text-red-600 dark:text-red-300">{{ setupFieldErrors.engineHours }}</p>
                  </div>
                </div>
              </section>

              <section class="rounded-3xl border border-gray-100 p-5 dark:border-gray-800">
                <div class="mb-5">
                  <p class="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{{ workflowCopy.liveContext }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ workflowCopy.readyBeforeStart }}</h3>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ store.t('driver') }}</p>
                    <p class="mt-1 font-medium text-gray-900 dark:text-white">{{ driverDisplayName }}</p>
                  </div>
                  <div class="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ workflowCopy.dateLabel }}</p>
                    <p class="mt-1 font-medium text-gray-900 dark:text-white">{{ inspectionDateLabel }}</p>
                  </div>
                  <div class="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ workflowCopy.lastOdometer }}</p>
                    <p class="mt-1 font-medium text-gray-900 dark:text-white">{{ selectedVehicle?.odometer != null ? `${Number(selectedVehicle.odometer).toLocaleString(localeCode)} ${activeDistanceUnit}` : '—' }}</p>
                  </div>
                  <div class="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800/70">
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ workflowCopy.checklistItems }}</p>
                    <p class="mt-1 font-medium text-gray-900 dark:text-white">{{ items.length }}</p>
                  </div>
                </div>

                <div class="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  {{ workflowCopy.stepHelp }}
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="isChecklistStep && currentChecklistItem">
            <div class="space-y-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{{ workflowCopy.checklistItem(currentChecklistNumber, items.length) }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ currentChecklistItem.label }}</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ currentChecklistItem.section || workflowCopy.general }}</p>
                </div>
                <div class="flex gap-2 text-xs">
                  <span class="rounded-full bg-green-50 px-3 py-1 text-green-600 dark:bg-green-900/20 dark:text-green-300">{{ passCount }} {{ workflowCopy.passShort }}</span>
                  <span class="rounded-full bg-red-50 px-3 py-1 text-red-600 dark:bg-red-900/20 dark:text-red-300">{{ failCount }} {{ workflowCopy.issuesShort }}</span>
                </div>
              </div>

              <section class="rounded-3xl border border-gray-100 p-5 dark:border-gray-800">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="flex items-center gap-4">
                    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/70">
                      <component :is="currentChecklistItem.icon" :size="26" :class="currentChecklistItem.state === 'pass' ? 'text-green-500' : currentChecklistItem.state === 'fail' ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ workflowCopy.evaluateItem }}</p>
                      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ workflowCopy.evaluateItemDescription }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3 lg:min-w-[270px]">
                    <button
                      type="button"
                      class="rounded-2xl border-2 px-4 py-4 text-sm font-semibold transition-all"
                      :class="currentChecklistItem.state === 'pass' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-green-600 dark:hover:text-green-300'"
                      @click="setState(currentChecklistItem, 'pass')"
                    >
                      <div class="flex items-center justify-center gap-2"><Check :size="16" /> {{ workflowCopy.passAction }}</div>
                    </button>
                    <button
                      type="button"
                      class="rounded-2xl border-2 px-4 py-4 text-sm font-semibold transition-all"
                      :class="currentChecklistItem.state === 'fail' ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-600 dark:hover:text-red-300'"
                      @click="setState(currentChecklistItem, 'fail')"
                    >
                      <div class="flex items-center justify-center gap-2"><X :size="16" /> {{ workflowCopy.issueFound }}</div>
                    </button>
                  </div>
                </div>

                <Transition name="slide">
                  <div v-if="currentChecklistItem.state === 'fail' || (currentChecklistItem.photoEnabled && currentChecklistItem.state !== null)" class="mt-5 space-y-4 border-t border-gray-100 pt-5 dark:border-gray-800">
                    <div v-if="currentChecklistItem.state === 'fail'">
                      <label class="label">{{ workflowCopy.issueNote }}</label>
                      <textarea
                        v-model="currentChecklistItem.note"
                        :placeholder="store.t('describeIssue')"
                        rows="3"
                        class="w-full resize-none rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-gray-700 outline-none transition-colors placeholder-red-300 focus:border-red-300 dark:border-red-900/60 dark:bg-red-900/10 dark:text-gray-100 dark:placeholder-red-700"
                      />
                    </div>

                    <div v-if="currentChecklistItem.photoEnabled" class="space-y-3">
                      <div class="flex flex-wrap items-center gap-3">
                        <label :for="`photo-input-${currentChecklistItem.id}`" class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:text-blue-300">
                          <Camera :size="15" /> {{ workflowCopy.addPhoto }}
                        </label>
                        <input :id="`photo-input-${currentChecklistItem.id}`" type="file" accept="image/*" multiple class="hidden" @change="handlePhotoSelected($event, currentChecklistItem)" />
                        <span class="text-xs text-gray-400 dark:text-gray-500">{{ workflowCopy.photoCount(currentChecklistItem.photos.length, MAX_PHOTOS_PER_ITEM) }}</span>
                        <span v-if="currentChecklistItem.photoRequired" class="text-xs text-amber-600 dark:text-amber-300">{{ workflowCopy.minimumOnePhotoRequired }}</span>
                      </div>

                      <div v-if="currentChecklistItem.photos.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                        <div v-for="photo in currentChecklistItem.photos" :key="photo.id" class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">
                          <img :src="photo.previewUrl" :alt="workflowCopy.inspectionEvidenceAlt" class="h-28 w-full object-cover" />
                          <button type="button" class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow" @click="removePhoto(currentChecklistItem, photo.id)">
                            <X :size="12" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>

                <p v-if="checklistStepError" class="mt-4 text-sm text-red-600 dark:text-red-300">{{ checklistStepError }}</p>
              </section>
            </div>
          </template>

          <template v-else>
            <div class="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <section class="rounded-3xl border border-gray-100 p-5 dark:border-gray-800">
                <div class="mb-5">
                  <p class="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{{ workflowCopy.finalStep }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{{ workflowCopy.reviewAndSign }}</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ workflowCopy.reviewAndSignDescription }}</p>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="rounded-2xl bg-green-50 px-4 py-4 text-center dark:bg-green-900/20">
                    <p class="text-2xl font-bold text-green-600 dark:text-green-300">{{ passCount }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ workflowCopy.passed }}</p>
                  </div>
                  <div class="rounded-2xl bg-red-50 px-4 py-4 text-center dark:bg-red-900/20">
                    <p class="text-2xl font-bold text-red-600 dark:text-red-300">{{ failCount }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ workflowCopy.issues }}</p>
                  </div>
                  <div class="rounded-2xl bg-gray-50 px-4 py-4 text-center dark:bg-gray-800/70">
                    <p class="text-2xl font-bold text-gray-700 dark:text-gray-200">{{ items.reduce((total, item) => total + item.photos.length, 0) }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ workflowCopy.photos }}</p>
                  </div>
                </div>

                <div class="mt-5 rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-600 dark:bg-gray-800/70 dark:text-gray-300">
                  <div><span class="font-medium text-gray-900 dark:text-white">{{ workflowCopy.vehicleLabel }}:</span> {{ selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model} · #${selectedVehicle.unit}` : '—' }}</div>
                  <div class="mt-2"><span class="font-medium text-gray-900 dark:text-white">{{ workflowCopy.reportedBy }}:</span> {{ driverDisplayName }}</div>
                </div>

                <div class="mt-5">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ workflowCopy.referenceSignatureOnFile }}</p>
                  <div v-if="signatureReferenceUrl" class="mt-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
                    <img :src="signatureReferenceUrl" :alt="workflowCopy.referenceSignatureAlt" class="h-24 rounded-lg object-contain" />
                  </div>
                  <div v-else class="mt-3 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                    {{ workflowCopy.noReferenceSignature }}
                  </div>
                </div>
              </section>

              <section class="rounded-3xl border border-gray-100 p-5 dark:border-gray-800">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ workflowCopy.freshInspectionSignature }}</p>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ workflowCopy.freshInspectionSignatureDescription }}</p>
                  </div>
                  <button type="button" class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white" @click="clearSignaturePad">
                    {{ workflowCopy.clear }}
                  </button>
                </div>

                <div class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700">
                  <canvas
                    ref="signatureCanvas"
                    width="640"
                    height="240"
                    class="h-64 w-full touch-none bg-white"
                    @pointerdown.prevent="startSignatureStroke"
                    @pointermove.prevent="continueSignatureStroke"
                    @pointerup="finishSignatureStroke"
                    @pointerleave="finishSignatureStroke"
                    @pointercancel="finishSignatureStroke"
                  />
                </div>

                <div class="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-2">
                    <PenLine :size="14" />
                    <span>{{ signatureEmpty ? workflowCopy.drawSignatureToFinish : workflowCopy.freshSignatureCaptured }}</span>
                  </div>
                </div>

                <p v-if="signatureStepError" class="mt-3 text-sm text-red-600 dark:text-red-300">{{ signatureStepError }}</p>
              </section>
            </div>
          </template>
        </div>

        <div class="border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ workflowCopy.checklistItemsAnswered(doneCount, items.length) }}
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
                :disabled="currentStep === 0"
                @click="goToPreviousStep"
              >
                <ChevronLeft :size="16" /> {{ workflowCopy.back }}
              </button>

              <button
                v-if="!isSignatureStep"
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                @click="goToNextStep"
              >
                {{ nextButtonLabel }} <ChevronRight :size="16" />
              </button>

              <button
                v-else
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                @click="handleSubmit"
              >
                {{ store.t('submitInspection') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Camera, Check, X, Gauge, Lightbulb, Disc, Droplets, ShieldCheck, FileText, ChevronLeft, ChevronRight, PenLine } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/layout/AppLayout.vue'
import { supabase } from '@/lib/supabase'
import { getInspectionWorkflowCopy, inspectionWorkflowLocales } from '@/lib/inspectionWorkflowText'
import { uploadInspectionPhoto, uploadInspectionSignature } from '@/api/storage'
import { getLocalizedTemplateItemText, type TemplateItemTranslations } from '@/lib/inspectionTemplateCatalog'
import { getLocalizedTemplateName, parseInspectionTemplatePayload, type TemplateNameTranslations } from '@/lib/inspectionTemplatePayload'
import { getVehicleTypeLabel, normalizeVehicleType } from '@/lib/vehicleCatalog'
import { defaultDimensionUnitForCountry, defaultDistanceUnitForCountry, type DimensionUnit, type DistanceUnit } from '@/lib/measurementUnits'
import { getSupabaseErrorMessage, isSupabaseMissingColumnError, normalizeSupabaseSchemaErrorMessage } from '@/lib/supabaseErrors'

const props = defineProps<{ isPostTrip?: boolean }>()
const store = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

type State = 'pass' | 'fail' | null
type VehicleSummary = { id: string; unit: string; type: string; make: string; model: string; plate: string; odometer?: number | null; engine_hours?: number | null; assigned_driver_id?: string | null; assigned_driver_name?: string | null }
type InspectionPhoto = { id: string; previewUrl: string; file: File | null; uploadedUrl: string | null }
interface Item { id: string; section: string; label: string; icon: unknown; state: State; note: string; photos: InspectionPhoto[]; required: boolean; photoEnabled: boolean; photoRequired: boolean }
interface TemplateItem { id?: string; section?: string; label: string; translationKey?: string; translations?: TemplateItemTranslations; required?: boolean; enabled?: boolean; photoEnabled?: boolean; photoRequired?: boolean }
interface TemplateOption { id: string; name: string; nameTranslations?: TemplateNameTranslations; vehicleType: string; distanceUnit: DistanceUnit; dimensionUnit: DimensionUnit; items: TemplateItem[] }

const MAX_PHOTOS_PER_ITEM = 5

const fallbackItems: TemplateItem[] = [
  { id: 'tires', section: 'Tires', label: 'Tires & wheels', required: true, enabled: true, photoEnabled: true, photoRequired: false },
  { id: 'lights', section: 'Lights', label: 'Lights & signals', required: true, enabled: true, photoEnabled: false, photoRequired: false },
  { id: 'brakes', section: 'Brakes', label: 'Brakes', required: true, enabled: true, photoEnabled: false, photoRequired: false },
  { id: 'fluids', section: 'Fluids', label: 'Fluid levels', required: true, enabled: true, photoEnabled: true, photoRequired: false },
  { id: 'safety', section: 'Safety', label: 'Safety equipment', required: true, enabled: true, photoEnabled: false, photoRequired: false },
  { id: 'docs', section: 'Documents', label: 'Documents', required: true, enabled: true, photoEnabled: true, photoRequired: true },
]

const items = ref<Item[]>([])
const templateOptions = ref<TemplateOption[]>([])
const selectedTemplateId = ref('')
const availableVehicles = ref<VehicleSummary[]>([])
const selectedVehicleId = ref('')
const activeTemplateName = ref('')
const activeTemplateNameTranslations = ref<TemplateNameTranslations | undefined>()
const activeTemplateVehicleType = ref('')
const activeDistanceUnit = ref<DistanceUnit>(defaultDistanceUnitForCountry(authStore.currentCompany?.country))
const activeDimensionUnit = ref<DimensionUnit>(defaultDimensionUnitForCountry(authStore.currentCompany?.country))
const templatesLoading = ref(false)
const vehiclesLoading = ref(false)
const templateError = ref('')
const templateSelectionError = ref('')
const submitError = ref('')
const setupFieldErrors = reactive({
  vehicle: '',
  template: '',
  odometer: '',
  engineHours: '',
})
const checklistStepError = ref('')
const signatureStepError = ref('')
const currentOdometer = ref<number | null>(null)
const currentEngineHours = ref<number | null>(null)
const currentStep = ref(0)
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const signatureDrawing = ref(false)
const signatureDataUrl = ref('')
const signatureEmpty = ref(true)
const uploadedSignatureUrl = ref('')

function iconForItem(section: string, label: string) {
  const lookup = `${section} ${label}`.toLowerCase()

  if (lookup.includes('light')) return Lightbulb
  if (lookup.includes('brake')) return Disc
  if (lookup.includes('fluid') || lookup.includes('oil') || lookup.includes('coolant')) return Droplets
  if (lookup.includes('document') || lookup.includes('registration') || lookup.includes('insurance')) return FileText
  if (lookup.includes('safety') || lookup.includes('seat belt') || lookup.includes('harness')) return ShieldCheck
  return Gauge
}

function buildChecklistItems(templateItems: TemplateItem[]) {
  return templateItems
    .filter((item) => item.enabled !== false)
    .map((item, index) => {
      const localizedText = getLocalizedTemplateItemText(item, store.language)
      const sourceSection = item.section || localizedText.section || workflowCopy.value.general
      const sourceLabel = item.label || localizedText.label

      return {
        id: item.id || `template-item-${index}`,
        section: localizedText.section || sourceSection,
        label: localizedText.label || sourceLabel,
        icon: iconForItem(sourceSection, sourceLabel),
        state: null,
        note: '',
        photos: [],
        required: item.required !== false,
        photoEnabled: item.photoEnabled ?? false,
        photoRequired: item.photoRequired ?? false,
      }
    })
}

const selectedVehicle = computed(() => availableVehicles.value.find((vehicle) => vehicle.id === selectedVehicleId.value) || null)
const workflowCopy = computed(() => getInspectionWorkflowCopy(store.language))
const localeCode = computed(() => inspectionWorkflowLocales[store.language] || inspectionWorkflowLocales.en)
const tripTypeBadgeLabel = computed(() => props.isPostTrip ? workflowCopy.value.tripTypeShort.post : workflowCopy.value.tripTypeShort.pre)
const localizedActiveTemplateName = computed(() => getLocalizedTemplateName(activeTemplateName.value, activeTemplateNameTranslations.value, store.language))
const localizedActiveTemplateVehicleType = computed(() => getVehicleTypeLabel(activeTemplateVehicleType.value, store.language))
const inspectionDateLabel = computed(() => new Intl.DateTimeFormat(localeCode.value, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date()))
const dashboardRoute = computed(() => authStore.role === 'driver' ? '/driver' : '/dashboard')
const driverDisplayName = computed(() => {
  const firstName = authStore.profile?.first_name || ''
  const lastName = authStore.profile?.last_name || ''
  return `${firstName} ${lastName}`.trim() || authStore.user?.email || store.t('driver')
})
const signatureReferenceUrl = computed(() => authStore.profile?.signature_url || '')
const visibleTemplateError = computed(() => templateError.value)
const signatureStepIndex = computed(() => items.value.length + 1)
const totalWizardSteps = computed(() => items.value.length + 2)
const isSetupStep = computed(() => currentStep.value === 0)
const isChecklistStep = computed(() => currentStep.value > 0 && currentStep.value < signatureStepIndex.value)
const isSignatureStep = computed(() => currentStep.value === signatureStepIndex.value)
const currentChecklistIndex = computed(() => currentStep.value - 1)
const currentChecklistNumber = computed(() => currentChecklistIndex.value + 1)
const currentChecklistItem = computed<Item | null>(() => items.value[currentChecklistIndex.value] || null)
const doneCount = computed(() => items.value.filter((item) => item.state !== null).length)
const passCount = computed(() => items.value.filter((item) => item.state === 'pass').length)
const failCount = computed(() => items.value.filter((item) => item.state === 'fail').length)
const progress = computed(() => items.value.length ? Math.round((doneCount.value / items.value.length) * 100) : 0)
const wizardStepProgress = computed(() => totalWizardSteps.value > 1 ? Math.round((currentStep.value / (totalWizardSteps.value - 1)) * 100) : 0)
const currentStepLabel = computed(() => {
  if (isSetupStep.value) {
    return workflowCopy.value.stepOneOfSetup
  }

  if (isSignatureStep.value) {
    return workflowCopy.value.finalStepOf(totalWizardSteps.value)
  }

  return workflowCopy.value.checklistItem(currentChecklistNumber.value, items.value.length)
})
const nextButtonLabel = computed(() => {
  if (isSetupStep.value) {
    return workflowCopy.value.beginChecklist
  }

  return currentChecklistNumber.value >= items.value.length ? workflowCopy.value.reviewAndSign : workflowCopy.value.nextItem
})

function closeInspection() {
  router.push(dashboardRoute.value)
}

function resetSignatureState() {
  signatureDataUrl.value = ''
  uploadedSignatureUrl.value = ''
  signatureEmpty.value = true
  signatureDrawing.value = false
}

function clearSetupFieldErrors() {
  setupFieldErrors.vehicle = ''
  setupFieldErrors.template = ''
  setupFieldErrors.odometer = ''
  setupFieldErrors.engineHours = ''
}

function clearInlineStepErrors() {
  clearSetupFieldErrors()
  checklistStepError.value = ''
  signatureStepError.value = ''
}

function fillSignatureCanvasBackground() {
  const canvas = signatureCanvas.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    return
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 2.5
  context.strokeStyle = '#0f172a'
}

function redrawSignatureCanvas() {
  fillSignatureCanvasBackground()

  if (!signatureDataUrl.value || !signatureCanvas.value) {
    return
  }

  const context = signatureCanvas.value.getContext('2d')

  if (!context) {
    return
  }

  const image = new Image()
  image.onload = () => {
    fillSignatureCanvasBackground()
    context.drawImage(image, 0, 0, signatureCanvas.value!.width, signatureCanvas.value!.height)
  }
  image.src = signatureDataUrl.value
}

function clearSignaturePad() {
  resetSignatureState()
  signatureStepError.value = ''
  fillSignatureCanvasBackground()
}

function getCanvasPoint(event: PointerEvent) {
  const canvas = signatureCanvas.value

  if (!canvas) {
    return { x: 0, y: 0 }
  }

  const rect = canvas.getBoundingClientRect()

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  }
}

function startSignatureStroke(event: PointerEvent) {
  const canvas = signatureCanvas.value
  const context = canvas?.getContext('2d')

  if (!canvas || !context) {
    return
  }

  uploadedSignatureUrl.value = ''
  signatureStepError.value = ''
  const point = getCanvasPoint(event)
  signatureDrawing.value = true
  signatureEmpty.value = false
  context.beginPath()
  context.moveTo(point.x, point.y)
}

function continueSignatureStroke(event: PointerEvent) {
  const canvas = signatureCanvas.value
  const context = canvas?.getContext('2d')

  if (!signatureDrawing.value || !canvas || !context) {
    return
  }

  const point = getCanvasPoint(event)
  context.lineTo(point.x, point.y)
  context.stroke()
}

function finishSignatureStroke() {
  if (!signatureDrawing.value || !signatureCanvas.value) {
    return
  }

  signatureDrawing.value = false
  signatureDataUrl.value = signatureCanvas.value.toDataURL('image/png')
}

async function syncSignatureCanvasStep() {
  if (!isSignatureStep.value) {
    return
  }

  await nextTick()

  if (signatureDataUrl.value) {
    redrawSignatureCanvas()
    return
  }

  clearSignaturePad()
}

function syncVehicleTelemetry() {
  currentOdometer.value = selectedVehicle.value?.odometer ?? null
  currentEngineHours.value = selectedVehicle.value?.engine_hours ?? null
}

function formatVehicleOption(vehicle: VehicleSummary) {
  const parts = [`#${vehicle.unit}`]

  if (vehicle.plate) {
    parts.push(vehicle.plate)
  }

  const modelLabel = `${vehicle.make || ''} ${vehicle.model || ''}`.trim()

  if (modelLabel) {
    parts.push(modelLabel)
  }

  return parts.join(' · ')
}

function getRequestedVehicleId() {
  return typeof route.query.vehicleId === 'string' ? route.query.vehicleId : ''
}

function applyRequestedVehicleSelection() {
  const requestedVehicleId = getRequestedVehicleId()

  if (!requestedVehicleId) {
    selectedVehicleId.value = availableVehicles.value[0]?.id || ''
    syncVehicleTelemetry()
    return
  }

  const matchedVehicle = availableVehicles.value.find((vehicle) => vehicle.id === requestedVehicleId)
  selectedVehicleId.value = matchedVehicle?.id || availableVehicles.value[0]?.id || ''
  syncVehicleTelemetry()

  if (!matchedVehicle) {
    submitError.value = workflowCopy.value.selectedVehicleUnavailable
  }
}

function resetInspectionFlow() {
  currentStep.value = 0
  submitError.value = ''
  clearInlineStepErrors()
  resetSignatureState()
}

function clearMatchedTemplate() {
  selectedTemplateId.value = ''
  activeTemplateName.value = ''
  activeTemplateNameTranslations.value = undefined
  activeTemplateVehicleType.value = normalizeVehicleType(selectedVehicle.value?.type) || workflowCopy.value.unknownType
  activeDistanceUnit.value = defaultDistanceUnitForCountry(authStore.currentCompany?.country)
  activeDimensionUnit.value = defaultDimensionUnitForCountry(authStore.currentCompany?.country)
  items.value = []
  resetInspectionFlow()
}

function matchTemplateForVehicleType() {
  const vehicleType = normalizeVehicleType(selectedVehicle.value?.type)
  const matchingTemplate = templateOptions.value.find((template) => normalizeVehicleType(template.vehicleType) === vehicleType)
  const localizedVehicleType = getVehicleTypeLabel(vehicleType, store.language) || vehicleType

  if (!matchingTemplate) {
    templateSelectionError.value = vehicleType
      ? workflowCopy.value.noActiveTemplateConfigured(tripTypeBadgeLabel.value, localizedVehicleType)
      : workflowCopy.value.selectVehicleWithValidType
    clearMatchedTemplate()
    return
  }

  templateSelectionError.value = ''
  selectedTemplateId.value = matchingTemplate.id
  applySelectedTemplate()
}

function handleVehicleChange() {
  submitError.value = ''
  clearSetupFieldErrors()
  syncVehicleTelemetry()
  matchTemplateForVehicleType()
}

function applySelectedTemplate() {
  const selectedTemplate = templateOptions.value.find((template) => template.id === selectedTemplateId.value)

  if (!selectedTemplate) {
    clearMatchedTemplate()
    return
  }

  templateSelectionError.value = ''
  items.value = buildChecklistItems(selectedTemplate.items)
  activeTemplateName.value = selectedTemplate.name
  activeTemplateNameTranslations.value = selectedTemplate.nameTranslations
  activeTemplateVehicleType.value = selectedTemplate.vehicleType
  activeDistanceUnit.value = selectedTemplate.distanceUnit
  activeDimensionUnit.value = selectedTemplate.dimensionUnit
  resetInspectionFlow()
}

async function loadInspectionTemplates() {
  templateError.value = ''
  templateSelectionError.value = ''

  if (!authStore.companyId) {
    templateOptions.value = []
    clearMatchedTemplate()
    return
  }

  templatesLoading.value = true

  const { data, error } = await supabase
    .from('inspection_templates')
    .select('id, name, vehicle_type, distance_unit, dimension_unit, items')
    .eq('company_id', authStore.companyId)
    .eq('inspection_type', props.isPostTrip ? 'post-trip' : 'pre-trip')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    templateError.value = normalizeSupabaseSchemaErrorMessage(error.message) || error.message
    templateOptions.value = []
    clearMatchedTemplate()
    templatesLoading.value = false
    return
  }

  templateOptions.value = (data || []).map((template) => {
    const parsedPayload = parseInspectionTemplatePayload<TemplateItem>(template.items)

    return {
      id: template.id,
      name: template.name,
      nameTranslations: parsedPayload.nameTranslations,
      vehicleType: template.vehicle_type,
      distanceUnit: (template.distance_unit || defaultDistanceUnitForCountry(authStore.currentCompany?.country)) as DistanceUnit,
      dimensionUnit: (template.dimension_unit || defaultDimensionUnitForCountry(authStore.currentCompany?.country)) as DimensionUnit,
      items: parsedPayload.items,
    }
  })

  matchTemplateForVehicleType()
  templatesLoading.value = false
}

async function loadVehicles() {
  submitError.value = ''

  if (!authStore.companyId) {
    availableVehicles.value = []
    selectedVehicleId.value = ''
    clearMatchedTemplate()
    return
  }

  vehiclesLoading.value = true

  const { data: assignments, error: assignmentsError } = await supabase
    .from('vehicle_company_assignments')
    .select('vehicle_id, assigned_driver_id')
    .eq('company_id', authStore.companyId)

  if (assignmentsError) {
    vehiclesLoading.value = false
    submitError.value = assignmentsError.message
    availableVehicles.value = []
    selectedVehicleId.value = ''
    clearMatchedTemplate()
    return
  }

  const vehicleIds = (assignments || []).map((assignment) => assignment.vehicle_id)
  const assignedDriverIds = [...new Set((assignments || []).map((assignment) => assignment.assigned_driver_id).filter(Boolean))]

  if (vehicleIds.length === 0) {
    vehiclesLoading.value = false
    availableVehicles.value = []
    selectedVehicleId.value = ''
    syncVehicleTelemetry()
    clearMatchedTemplate()
    return
  }

  const [{ data, error }, { data: drivers, error: driversError }] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, unit, type, make, model, plate, odometer, engine_hours')
      .in('id', vehicleIds)
      .order('make', { ascending: true }),
    assignedDriverIds.length
      ? supabase.from('drivers').select('id, first_name, last_name').in('id', assignedDriverIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  vehiclesLoading.value = false

  if (error || driversError) {
    submitError.value = error?.message || driversError?.message || workflowCopy.value.unableLoadVehicles
    availableVehicles.value = []
    selectedVehicleId.value = ''
    clearMatchedTemplate()
    return
  }

  const assignmentMap = new Map((assignments || []).map((assignment) => [assignment.vehicle_id, assignment.assigned_driver_id || null]))
  const driverNameMap = new Map((drivers || []).map((driver: any) => [driver.id, `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || workflowCopy.value.assignedDriver]))

  availableVehicles.value = ((data || []) as VehicleSummary[]).map((vehicle) => ({
    ...vehicle,
    assigned_driver_id: assignmentMap.get(vehicle.id) || null,
    assigned_driver_name: assignmentMap.get(vehicle.id) ? (driverNameMap.get(assignmentMap.get(vehicle.id) as string) || null) : null,
  }))
  applyRequestedVehicleSelection()
}

function setState(item: Item, state: State) {
  item.state = state
  checklistStepError.value = ''
}

function revokePhotoPreview(photo: InspectionPhoto) {
  if (photo.file && photo.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(photo.previewUrl)
  }
}

function removePhoto(item: Item, photoId: string) {
  const photoIndex = item.photos.findIndex((photo) => photo.id === photoId)

  if (photoIndex === -1) {
    return
  }

  revokePhotoPreview(item.photos[photoIndex])
  item.photos.splice(photoIndex, 1)
  checklistStepError.value = ''
}

function handlePhotoSelected(event: Event, item: Item) {
  checklistStepError.value = ''

  const input = event.target as HTMLInputElement
  const selectedFiles = Array.from(input.files || [])

  if (selectedFiles.length === 0) {
    return
  }

  const remainingSlots = MAX_PHOTOS_PER_ITEM - item.photos.length

  if (remainingSlots <= 0) {
    checklistStepError.value = workflowCopy.value.maxPhotosPerItem
    input.value = ''
    return
  }

  const acceptedFiles = selectedFiles.slice(0, remainingSlots)

  for (const file of acceptedFiles) {
    item.photos.push({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      file,
      uploadedUrl: null,
    })
  }

  if (selectedFiles.length > acceptedFiles.length) {
    checklistStepError.value = workflowCopy.value.firstFivePhotosKept
  }

  input.value = ''
}

function getSetupValidationError() {
  clearSetupFieldErrors()

  if (!selectedVehicle.value) {
    setupFieldErrors.vehicle = workflowCopy.value.selectVehicleBeforeStart
  }

  if (!activeTemplateName.value || items.value.length === 0) {
    setupFieldErrors.template = templateSelectionError.value || workflowCopy.value.noActiveTemplateConfiguredForCurrentType(tripTypeBadgeLabel.value)
  }

  if (currentOdometer.value === null || Number.isNaN(Number(currentOdometer.value))) {
    setupFieldErrors.odometer = workflowCopy.value.enterCurrentOdometer
  } else if (selectedVehicle.value?.odometer != null && Number(currentOdometer.value) < Number(selectedVehicle.value.odometer)) {
    setupFieldErrors.odometer = workflowCopy.value.odometerBelowLast(Number(selectedVehicle.value.odometer).toLocaleString(localeCode.value), activeDistanceUnit.value)
  }

  if (currentEngineHours.value !== null && selectedVehicle.value?.engine_hours != null && Number(currentEngineHours.value) < Number(selectedVehicle.value.engine_hours)) {
    setupFieldErrors.engineHours = workflowCopy.value.engineHoursBelowLast(Number(selectedVehicle.value.engine_hours).toLocaleString(localeCode.value))
  }

  return setupFieldErrors.vehicle || setupFieldErrors.template || setupFieldErrors.odometer || setupFieldErrors.engineHours
}

function getChecklistValidationError(item: Item | null) {
  if (!item) {
    return workflowCopy.value.checklistItemNotFound
  }

  if (item.state === null) {
    return workflowCopy.value.choosePassOrIssue
  }

  if (item.photoRequired && item.photos.length === 0) {
    return workflowCopy.value.addRequiredPhoto
  }

  return ''
}

function getSignatureValidationError() {
  if (signatureEmpty.value || !signatureDataUrl.value) {
    return workflowCopy.value.drawFreshSignatureBeforeSubmit
  }

  return ''
}

function validateCurrentStep() {
  clearInlineStepErrors()

  if (isSetupStep.value) {
    return getSetupValidationError()
  }

  if (isChecklistStep.value) {
    return getChecklistValidationError(currentChecklistItem.value)
  }

  if (isSignatureStep.value) {
    return getSignatureValidationError()
  }

  return ''
}

function goToNextStep() {
  submitError.value = ''
  const validationError = validateCurrentStep()

  if (validationError) {
    if (isChecklistStep.value) {
      checklistStepError.value = validationError
      return
    }

    if (isSignatureStep.value) {
      signatureStepError.value = validationError
      return
    }

    return
  }

  submitError.value = ''

  if (currentStep.value < totalWizardSteps.value - 1) {
    currentStep.value += 1
  }
}

function goToPreviousStep() {
  submitError.value = ''
  clearInlineStepErrors()

  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

async function signatureDataUrlToFile() {
  const response = await fetch(signatureDataUrl.value)
  const blob = await response.blob()
  return new File([blob], `inspection-signature-${crypto.randomUUID()}.png`, { type: 'image/png' })
}

async function insertInspectionRecord(insertPayload: Record<string, unknown>) {
  const { error: inspectionInsertError } = await supabase
    .from('inspections')
    .insert(insertPayload)

  if (!inspectionInsertError) {
    return
  }

  if (!isSupabaseMissingColumnError(inspectionInsertError, 'inspections', 'signature_url')) {
    throw inspectionInsertError
  }

  const { signature_url, ...legacyInsertPayload } = insertPayload

  const { error: legacyInspectionInsertError } = await supabase
    .from('inspections')
    .insert(legacyInsertPayload)

  if (legacyInspectionInsertError) {
    throw legacyInspectionInsertError
  }
}

async function handleSubmit() {
  submitError.value = ''

  const stepValidationError = validateCurrentStep()
  if (stepValidationError) {
    if (isSignatureStep.value) {
      signatureStepError.value = stepValidationError
      return
    }

    submitError.value = stepValidationError
    return
  }

  if (!selectedVehicle.value) {
    submitError.value = workflowCopy.value.selectVehicleBeforeSubmit
    return
  }

  const missingChecks = items.value.filter((item) => item.state === null)
  if (missingChecks.length > 0) {
    submitError.value = workflowCopy.value.completeEveryChecklistItem
    return
  }

  const missingPhotos = items.value.filter((item) => item.photoRequired && item.photos.length === 0)
  if (missingPhotos.length > 0) {
    submitError.value = workflowCopy.value.addPhotosToRequiredItems
    return
  }

  const performerRole = authStore.currentCompany?.role || authStore.profile?.role || 'user'
  const performerName = driverDisplayName.value
  let inspectionSignatureUrl = uploadedSignatureUrl.value

  if (authStore.user?.id && authStore.companyId) {
    try {
      if (!inspectionSignatureUrl) {
        const signatureFile = await signatureDataUrlToFile()
        inspectionSignatureUrl = await uploadInspectionSignature(signatureFile, authStore.user.id)
        uploadedSignatureUrl.value = inspectionSignatureUrl
      }

      const { data: driverRecord } = await supabase
        .from('drivers')
        .select('id')
        .eq('auth_user_id', authStore.user.id)
        .maybeSingle()

      const inspectionDriverId = driverRecord?.id || selectedVehicle.value.assigned_driver_id || null
      const notes = items.value
        .filter((item) => item.state === 'fail' && item.note.trim())
        .map((item) => `${item.section}: ${item.label} - ${item.note.trim()}`)
        .join('\n')

      const responsePayload = await Promise.all(items.value.map(async (item) => {
        const photoUrls = await Promise.all(item.photos.map(async (photo) => {
          if (photo.uploadedUrl) {
            return photo.uploadedUrl
          }

          if (photo.file) {
            const uploadedUrl = await uploadInspectionPhoto(photo.file, authStore.companyId as string, selectedVehicle.value!.id, item.id)
            photo.uploadedUrl = uploadedUrl
            return uploadedUrl
          }

          return photo.previewUrl
        }))

        return {
          id: item.id,
          section: item.section,
          label: item.label,
          state: item.state,
          note: item.note || null,
          photos: photoUrls,
          required: item.required,
          photo_required: item.photoRequired,
        }
      }))

      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({
          odometer: Number(currentOdometer.value),
          engine_hours: currentEngineHours.value !== null ? Number(currentEngineHours.value) : null,
        })
        .eq('id', selectedVehicle.value.id)

      if (vehicleUpdateError) {
        throw vehicleUpdateError
      }

      await insertInspectionRecord({
        company_id: authStore.companyId,
        driver_id: inspectionDriverId,
        vehicle_id: selectedVehicle.value.id,
        performed_by_user_id: authStore.user.id,
        inspection_type: props.isPostTrip ? 'post-trip' : 'pre-trip',
        result: failCount.value > 0 ? 'fail' : 'pass',
        notes: notes || null,
        vehicle_odometer: Number(currentOdometer.value),
        vehicle_engine_hours: currentEngineHours.value !== null ? Number(currentEngineHours.value) : null,
        distance_unit: activeDistanceUnit.value,
        dimension_unit: activeDimensionUnit.value,
        signature_url: inspectionSignatureUrl,
        responses: responsePayload,
      })
    } catch (error) {
      console.error(workflowCopy.value.unableSaveInspection, error)
      submitError.value = getSupabaseErrorMessage(error, workflowCopy.value.unableSaveInspection)
      return
    }
  }

  store.setInspectionContext({
    vehicle: `${selectedVehicle.value.make} ${selectedVehicle.value.model} · #${selectedVehicle.value.unit}`,
    driver: selectedVehicle.value.assigned_driver_name || driverDisplayName.value,
    performedBy: `${performerName} (${performerRole})`,
    type: props.isPostTrip ? store.t('postTripInspection') : store.t('preTripInspection'),
    time: inspectionDateLabel.value,
    photosTaken: items.value.reduce((total, item) => total + item.photos.length, 0),
    signatureUrl: inspectionSignatureUrl || signatureDataUrl.value,
    passedCount: passCount.value,
    failedCount: failCount.value,
    naCount: items.value.filter((item) => item.state === null).length,
    duration: workflowCopy.value.durationMinutes(Math.max(1, Math.round(items.value.length / 3))),
  })
  store.setInspectionResult(failCount.value > 0 ? 'fail' : 'pass')
  router.push('/inspect/result')
}

onMounted(async () => {
  await loadVehicles()
  await loadInspectionTemplates()
})

watch(() => authStore.companyId, async () => {
  await loadVehicles()
  await loadInspectionTemplates()
})

watch(() => route.query.vehicleId, () => {
  if (availableVehicles.value.length === 0) {
    return
  }

  submitError.value = ''
  applyRequestedVehicleSelection()
  matchTemplateForVehicleType()
})

watch(currentStep, async () => {
  submitError.value = ''
  await syncSignatureCanvasStep()
})

watch(currentOdometer, () => {
  setupFieldErrors.odometer = ''
})

watch(currentEngineHours, () => {
  setupFieldErrors.engineHours = ''
})

watch(() => items.value.length, () => {
  if (currentStep.value > signatureStepIndex.value) {
    currentStep.value = 0
  }
})

onBeforeUnmount(() => {
  items.value.forEach((item) => item.photos.forEach(revokePhotoPreview))
})
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
