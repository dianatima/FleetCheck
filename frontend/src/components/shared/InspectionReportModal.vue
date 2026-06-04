<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      @click.self="close"
    >
      <div class="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <!-- HEADER -->
        <div class="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
              <FileText :size="18" />
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ store.t('inspectionReportTitle') || 'Inspection Report' }}</h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400">{{ shortInspectionId ? `ID ${shortInspectionId}` : '—' }}</p>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            @click="close"
          >
            <X :size="18" />
          </button>
        </div>
        <!-- BODY (scrollable) -->
        <div class="max-h-[calc(100vh-8rem)] overflow-y-auto bg-gray-50/40 dark:bg-gray-950/40">
          <div v-if="loading" class="px-5 py-16 text-center text-sm text-gray-500">Loading inspection report…</div>
          <div v-else-if="error" class="px-5 py-16 text-center text-sm text-red-500">{{ error }}</div>
          <div v-else-if="inspection" class="space-y-5 p-4 sm:p-5">
            <!-- ACTION BAR -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  :disabled="pdfAction === 'preview'"
                  @click="runPdfAction('preview')"
                >
                  <Eye :size="14" /> {{ pdfAction === 'preview' ? store.t('opening') : store.t('previewPdf') }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  :disabled="pdfAction === 'share'"
                  @click="runPdfAction('share')"
                >
                  <Share2 :size="14" /> {{ pdfAction === 'share' ? store.t('sharing') : store.t('shareCopy') }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  :disabled="pdfAction === 'download'"
                  @click="runPdfAction('download')"
                >
                  <Download :size="14" /> {{ pdfAction === 'download' ? store.t('preparingPdf') : `${store.t('download')} ${store.t('pdf')}` }}
                </button>
              </div>
              <button
                v-if="canViewFraudInsights"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
                @click="showDeleteModal = true"
              >
                <Trash2 :size="14" /> {{ store.t('delete') }}
              </button>
            </div>
            <div v-if="pdfError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {{ pdfError }}
            </div>

            <!-- DELETE CONFIRM MODAL -->
            <Teleport to="body">
              <div v-if="showDeleteModal" class="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
                <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700">
                  <h3 class="text-lg font-semibold mb-2">{{ store.t('delete') }} {{ store.t('inspectionLabel') }}</h3>
                  <p class="text-sm mb-4">Для підтвердження видалення введіть свій email та пароль адміністратора.</p>
                  <form @submit.prevent="handleDelete">
                    <div class="mb-3">
                      <label class="block text-xs mb-1">Email</label>
                      <input v-model="deleteEmail" type="email" class="input-field w-full" required />
                    </div>
                    <div class="mb-3">
                      <label class="block text-xs mb-1">{{ store.t('password') }}</label>
                      <input v-model="deletePassword" type="password" class="input-field w-full" required />
                    </div>
                    <div v-if="deleteError" class="text-xs text-red-500 mb-2">{{ deleteError }}</div>
                    <div class="flex gap-2 justify-end">
                      <button type="button" class="btn-secondary" @click="showDeleteModal = false">{{ store.t('cancel') }}</button>
                      <button type="submit" class="btn-danger">{{ store.t('delete') }}</button>
                    </div>
                  </form>
                </div>
              </div>
            </Teleport>

            <!-- HERO: vehicle + result -->
            <div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-white shadow-sm dark:border-gray-800 dark:from-blue-900/20 dark:via-gray-900 dark:to-gray-900">
              <div class="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <div class="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <img v-if="vehiclePhotoUrl" :src="vehiclePhotoUrl" alt="" class="h-full w-full object-cover" />
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <Car :size="32" class="text-gray-300" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ vehicleName }}</h2>
                    <span :class="overallResultClass" class="text-[11px]">{{ overallResultLabel }}</span>
                  </div>
                  <p v-if="vehicleMeta" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ vehicleMeta }}</p>
                  <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                    <div>
                      <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{{ store.t('inspectionType') || 'Type' }}</p>
                      <p class="font-medium text-gray-800 dark:text-gray-200">{{ typeLabel }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{{ store.t('driver') }}</p>
                      <p class="truncate font-medium text-gray-800 dark:text-gray-200">{{ signerLabel }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{{ store.t('submitted') || 'Submitted' }}</p>
                      <p class="font-medium text-gray-800 dark:text-gray-200">{{ submittedLabel }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{{ store.t('odometer') }}</p>
                      <p class="font-medium text-gray-800 dark:text-gray-200">{{ inspectionOdometerLabel }} <span class="text-[10px] uppercase text-gray-400">{{ companyOdometerUnit }}</span></p>
                    </div>
                    <div v-if="dailyMileageLabel">
                      <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Mileage since previous</p>
                      <p class="font-medium text-gray-800 dark:text-gray-200">{{ dailyMileageLabel }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ previousInspectionLabel }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- METRIC STRIP -->
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ metricCounts.pass }}</p>
                <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('statusPassed') }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ metricCounts.fail }}</p>
                <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('statusFailed') }}</p>
              </div>
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p class="text-2xl font-bold text-gray-500 dark:text-gray-400">{{ metricCounts.na }}</p>
                <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">N/A</p>
              </div>
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ metricCounts.items }}</p>
                <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('checklistItems') }}</p>
              </div>
              <div class="col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:col-span-1">
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ metricCounts.photos }}</p>
                <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('photos') }}</p>
              </div>
            </div>

            <!-- TWO-COLUMN LAYOUT -->
            <div class="grid gap-5 lg:grid-cols-3">
              <div class="space-y-5 lg:col-span-2">
                <!-- SIGNATURE -->
                <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <PenLine :size="15" class="text-gray-400" />
                    <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.t('driverSignature') }}</h4>
                  </div>
                  <div class="p-4">
                    <div v-if="inspection.signature_data_url" class="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
                      <img
                        :src="inspection.signature_data_url"
                        alt="Driver signature"
                        class="mx-auto h-28 max-w-md rounded-lg bg-white object-contain"
                      />
                      <p class="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                        {{ store.t('signedBy') || 'Signed by' }} <span class="font-semibold text-gray-700 dark:text-gray-200">{{ signerLabel }}</span> · {{ signedAtLabel }}
                      </p>
                    </div>
                    <div v-else class="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      {{ store.t('noSignature') || 'No driver signature was attached to this report.' }}
                    </div>
                  </div>
                </section>

                <!-- PHOTOS GALLERY -->
                <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <div class="flex items-center gap-2">
                      <ImageIcon :size="15" class="text-gray-400" />
                      <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.t('photos') }}</h4>
                    </div>
                    <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{{ galleryPhotos.length }}</span>
                  </div>
                  <div v-if="galleryPhotos.length === 0" class="p-6 text-center text-sm text-gray-500">{{ store.t('noPhotos') || 'No photos were attached to this report.' }}</div>
                  <div v-else class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      v-for="(photo, index) in galleryPhotos"
                      :key="`${photo.rowId}-${index}`"
                      type="button"
                      class="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/70 dark:hover:border-blue-500/40"
                      @click="openPhotoLightbox(index)"
                    >
                      <div class="relative">
                        <img :src="photo.url" alt="" class="h-40 w-full object-cover transition group-hover:scale-105" />
                        <span :class="resultPillClass(photo.result)" class="absolute right-2 top-2 text-[10px] shadow-sm">{{ resultValueLabel(photo.result) }}</span>
                        <span v-if="photo.verification" :class="fraudLevelClass(photo.verification.risk_level || photo.verification.verification_status)" class="absolute left-2 top-2 text-[10px] shadow-sm">
                          {{ photo.verification.risk_score || 0 }}/100
                        </span>
                      </div>
                      <div class="space-y-1 p-3">
                        <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ photo.title }}</p>
                        <p class="text-[11px] text-gray-500 dark:text-gray-400">Item {{ photo.sortOrder }}</p>
                        <p v-if="photo.comment" class="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{{ photo.comment }}</p>
                        <div v-if="canViewFraudInsights" class="mt-1 space-y-1 border-t border-gray-100 pt-2 dark:border-gray-700">
                          <div class="flex items-center gap-1.5 text-[11px]" :class="photo.verification?.exif_taken_at ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'">
                            <CalendarClock :size="11" />
                            <span class="truncate">{{ photo.verification?.exif_taken_at ? formatDateTime(photo.verification.exif_taken_at, store.language) : (store.t('exifMissing') || 'no EXIF date') }}</span>
                          </div>
                          <div class="flex items-center gap-1.5 text-[11px]" :class="(photo.verification?.exif_device_make || photo.verification?.exif_device_model) ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'">
                            <Smartphone :size="11" />
                            <span class="truncate">{{ [photo.verification?.exif_device_make, photo.verification?.exif_device_model].filter(Boolean).join(' ') || (store.t('deviceUnknown') || 'unknown device') }}</span>
                          </div>
                          <a
                            v-if="photo.verification?.gps_latitude != null && photo.verification?.gps_longitude != null"
                            :href="`https://maps.google.com/?q=${photo.verification.gps_latitude},${photo.verification.gps_longitude}`"
                            target="_blank"
                            rel="noopener"
                            class="inline-flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                            @click.stop
                          >
                            <MapPin :size="11" />
                            <span class="truncate">{{ photo.verification.gps_latitude.toFixed(5) }}, {{ photo.verification.gps_longitude.toFixed(5) }}</span>
                          </a>
                          <div v-else class="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <MapPin :size="11" />
                            <span>{{ store.t('gpsMissing') || 'no GPS' }}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </section>

                <!-- CHECKLIST -->
                <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <div class="flex items-center gap-2">
                      <Clipboard :size="15" class="text-gray-400" />
                      <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.t('checklistItems') || 'Checklist Summary' }}</h4>
                    </div>
                    <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">{{ results.length }}</span>
                  </div>
                  <div v-if="results.length === 0" class="p-6 text-center text-sm text-gray-500">{{ store.t('noItems') || 'No inspection items found.' }}</div>
                  <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                    <li
                      v-for="row in results"
                      :key="row.id"
                      :class="['flex gap-3 px-4 py-3 border-l-4', checklistRowAccent(row.result)]"
                    >
                      <span class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{{ row.sortOrder }}</span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-1.5">
                          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ row.title }}</p>
                          <span v-if="row.category" class="badge-gray text-[10px]">{{ row.category }}</span>
                          <span v-if="row.requiresPhoto" class="badge-orange text-[10px]">{{ store.t('photo') || 'Photo' }}</span>
                        </div>
                        <p v-if="row.comment" class="mt-1 text-xs text-gray-600 dark:text-gray-300">{{ row.comment }}</p>
                        <p v-if="row.photoCount" class="mt-1 text-[11px] text-blue-600 dark:text-blue-400">{{ row.photoCount }} {{ store.t('photos') || 'photos' }}</p>
                      </div>
                      <span :class="resultPillClass(row.result)" class="h-fit shrink-0 text-[11px] whitespace-nowrap">{{ resultValueLabel(row.result) }}</span>
                    </li>
                  </ul>
                </section>
              </div>

              <!-- ANTI-FRAUD RAIL -->
              <aside v-if="canViewFraudInsights" class="space-y-5">
                <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <div class="flex items-center gap-2">
                      <ShieldAlert :size="15" class="text-gray-400" />
                      <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ store.t('antiFraudSummaryTitle') }}</h4>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        :disabled="reanalyzing"
                        @click="reanalyzeFraud"
                      >
                        <RefreshCcw :size="11" :class="reanalyzing ? 'animate-spin' : ''" />
                        {{ reanalyzing ? store.t('antiFraudReanalyzing') : store.t('antiFraudReanalyze') }}
                      </button>
                      <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">{{ fraudSummary.total }}</span>
                    </div>
                  </div>
                  <div class="space-y-4 p-4">
                    <p class="text-[11px] text-gray-500 dark:text-gray-400">{{ store.t('antiFraudSummaryHint') }}</p>
                    <div v-if="fraudLoadError" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200">
                      {{ fraudLoadError }}
                    </div>
                    <div v-else-if="fraudSummary.total === 0" class="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      <CheckCircle2 :size="14" /> {{ store.t('antiFraudNoRecords') }}
                    </div>
                    <template v-else>
                      <!-- GPS map -->
                      <div v-if="mapPoints.length" class="space-y-2">
                        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('antiFraudGpsMapTitle') }}</p>
                        <InspectionPhotoMap
                          :points="mapPoints"
                          :radius-meters="300"
                          :hint="store.t('antiFraudGpsMapHint')"
                          :outlier-text="store.t('antiFraudGpsOutlier')"
                        />
                      </div>
                      <!-- Risk gauge -->
                      <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                        <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('antiFraudMaxRisk') }}</p>
                        <div class="mt-1 flex items-baseline gap-1">
                          <span :class="riskScoreColor(fraudSummary.maxRisk)" class="text-3xl font-bold">{{ fraudSummary.maxRisk }}</span>
                          <span class="text-xs text-gray-400">/100</span>
                        </div>
                        <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div :class="riskBarColor(fraudSummary.maxRisk)" class="h-full transition-all" :style="{ width: `${fraudSummary.maxRisk}%` }"></div>
                        </div>
                      </div>
                      <!-- Distribution -->
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/20">
                          <p class="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">{{ store.t('antiFraudHighRisk') }}</p>
                          <p class="text-lg font-bold text-red-700 dark:text-red-200">{{ fraudSummary.highRisk }}</p>
                        </div>
                        <div class="rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20">
                          <p class="text-[10px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-300">{{ store.t('antiFraudSuspicious') }}</p>
                          <p class="text-lg font-bold text-orange-700 dark:text-orange-200">{{ fraudSummary.suspicious }}</p>
                        </div>
                        <div class="rounded-lg bg-yellow-50 px-3 py-2 dark:bg-yellow-900/20">
                          <p class="text-[10px] font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">{{ store.t('antiFraudNeedsReview') }}</p>
                          <p class="text-lg font-bold text-yellow-800 dark:text-yellow-200">{{ fraudSummary.needsReview }}</p>
                        </div>
                        <div class="rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                          <p class="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">{{ store.t('antiFraudOk') }}</p>
                          <p class="text-lg font-bold text-green-800 dark:text-green-200">{{ fraudSummary.ok }}</p>
                        </div>
                      </div>
                      <!-- Top flags -->
                      <div v-if="fraudSummary.topFlags.length" class="space-y-2">
                        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('antiFraudTopReasons') }}</p>
                        <div class="flex flex-wrap gap-1.5">
                          <span v-for="flag in fraudSummary.topFlags" :key="flag" class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <AlertTriangle :size="11" class="text-amber-500" /> {{ fraudFlagLabel(flag) }}
                          </span>
                        </div>
                      </div>
                      <!-- Suspicious photos -->
                      <div v-if="suspiciousPhotos.length" class="space-y-2">
                        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('antiFraudMostSuspiciousPhotos') }}</p>
                        <div class="space-y-2">
                          <div
                            v-for="row in suspiciousPhotos"
                            :key="row.id"
                            class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800/60"
                          >
                            <div class="flex items-center justify-between gap-2">
                              <span class="font-semibold text-gray-800 dark:text-gray-100">Item {{ row.photo_index + 1 }}</span>
                              <span :class="fraudLevelClass(row.risk_level || row.verification_status)" class="text-[10px] whitespace-nowrap">
                                {{ row.risk_score || 0 }}/100
                              </span>
                            </div>
                            <p class="mt-1 text-[11px] text-gray-700 dark:text-gray-200">{{ fraudVerdict(row) }}</p>
                            <ul v-if="(row.flags || []).length" class="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                              <li v-for="flag in (row.flags || [])" :key="`${row.id}-${flag}`">• {{ fraudFlagLabel(flag) }}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <!-- Duplicate comparison -->
                      <div v-if="duplicateComparisonRows.length" class="space-y-2">
                        <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{{ store.t('antiFraudPreviousVsCurrent') }}</p>
                        <div class="space-y-3">
                          <div
                            v-for="(pair, pairIndex) in duplicateComparisonRows"
                            :key="`${pair.current.id}-${pairIndex}`"
                            class="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60"
                          >
                            <div class="mb-2 flex items-center justify-between gap-2 text-xs">
                              <span class="font-semibold text-gray-800 dark:text-gray-100">
                                {{ pair.duplicateType === 'exact' ? store.t('antiFraudExactDuplicate') : store.t('antiFraudVisualDuplicate') }}
                              </span>
                              <span :class="fraudLevelClass(pair.current.risk_level || pair.current.verification_status)" class="text-[10px] whitespace-nowrap">
                                {{ pair.current.risk_score || 0 }}/100
                              </span>
                            </div>
                            <p class="mb-2 text-[11px] text-gray-600 dark:text-gray-300">{{ duplicateOriginSummary(pair.previous) }}</p>
                            <div class="grid grid-cols-2 gap-2">
                              <button type="button" class="overflow-hidden rounded-lg border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900" @click="openPairPhotoLightbox(pair, 'previous')">
                                <img :src="pair.previous.photo_url" alt="Previous report photo" class="h-24 w-full object-cover" />
                                <p class="px-2 py-1 text-[10px] text-gray-500 dark:text-gray-400">{{ store.t('antiFraudPreviousPhoto') }}</p>
                              </button>
                              <button type="button" class="overflow-hidden rounded-lg border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900" @click="openPairPhotoLightbox(pair, 'current')">
                                <img :src="pair.current.photo_url" alt="Current report photo" class="h-24 w-full object-cover" />
                                <p class="px-2 py-1 text-[10px] text-gray-500 dark:text-gray-400">{{ store.t('antiFraudCurrentPhoto') }}</p>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
    <PhotoLightbox
      v-model="photoLightboxOpen"
      :photos="lightboxPhotos"
      :start-index="lightboxStartIndex"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, Eye, Share2, X, MapPin, Car, FileText, Trash2, AlertTriangle, CheckCircle2, Image as ImageIcon, ShieldAlert, Clipboard, PenLine, CalendarClock, Smartphone, RefreshCcw } from 'lucide-vue-next'
import PhotoLightbox from '@/components/shared/PhotoLightbox.vue'
import InspectionPhotoMap from '@/components/shared/InspectionPhotoMap.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/dateFormat'
import { readSignatureFallback, readSignatureFallbackFromDb } from '@/lib/signatureFallback'
import { analyzeAndStoreInspectionPhotos } from '@/lib/photoFraud'
import { downloadInspectionReportPdf, previewInspectionReportPdf, shareInspectionReportPdf } from '@/lib/reportPdf'
import { normalizePhotoUrls } from '@/lib/photoUrls'

function isMissingSignatureColumnsError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return (
    value.includes('signature_data_url') ||
    value.includes('signed_at') ||
    value.includes('signed_by_driver_id')
  )
}

const props = defineProps<{
  modelValue: boolean
  inspectionId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const store = useAppStore()
const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)
const inspection = ref<any | null>(null)
const results = ref<any[]>([])
const photoVerifications = ref<any[]>([])
const verificationById = ref<Record<string, any>>({})
const fraudLoadError = ref<string | null>(null)
const previousInspection = ref<any | null>(null)
const photoLightboxOpen = ref(false)
const lightboxPhotos = ref<string[]>([])
const lightboxStartIndex = ref(0)
const showDeleteModal = ref(false)
const deleteEmail = ref('')
const deletePassword = ref('')
const deleteError = ref('')
const pdfAction = ref<'download' | 'preview' | 'share' | null>(null)
const pdfError = ref('')
const reanalyzing = ref(false)

const canViewFraudInsights = computed(() => authStore.role !== 'driver')

const mapPoints = computed(() => {
  return (photoVerifications.value || [])
    .filter((row: any) => Number.isFinite(row?.gps_latitude) && Number.isFinite(row?.gps_longitude))
    .map((row: any) => ({
      lat: Number(row.gps_latitude),
      lng: Number(row.gps_longitude),
      label: `Item ${(row.photo_index ?? 0) + 1}`,
      result: null,
      riskLevel: row.risk_level || row.verification_status || null,
      distanceFromCentroidM: Number.isFinite(row?.details?.geofence?.distance_m)
        ? Number(row.details.geofence.distance_m)
        : null,
    }))
})

watch(
  () => [props.modelValue, props.inspectionId] as const,
  async ([isOpen, inspectionId]) => {
    if (!isOpen || !inspectionId) return
    await fetchInspection(inspectionId)
  },
  { immediate: true }
)

const vehicleLabel = computed(() => {
  const vehicle = relation(inspection.value?.vehicles)
  if (!vehicle) return '—'

  return [
    `${vehicle.make || ''} ${vehicle.model || ''}`.trim(),
    vehicle.unit ? `#${vehicle.unit}` : '',
    vehicle.plate || '',
  ]
    .filter(Boolean)
    .join(' · ') || '—'
})

const vehicleName = computed(() => {
  const vehicle = relation(inspection.value?.vehicles)
  if (!vehicle) return '—'
  return `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || '—'
})

const vehicleMeta = computed(() => {
  const vehicle = relation(inspection.value?.vehicles)
  if (!vehicle) return ''
  return [
    vehicle.unit ? `#${vehicle.unit}` : '',
    vehicle.plate || '',
    vehicle.vin ? `VIN ${vehicle.vin}` : '',
  ].filter(Boolean).join(' · ')
})

const vehiclePhotoUrl = computed(() => relation(inspection.value?.vehicles)?.photo_url || null)

const companyOdometerUnit = computed(() => authStore.companyOdometerUnit || 'mi')

const inspectionOdometerLabel = computed(() => {
  const value = inspection.value?.odometer
  return value != null && Number.isFinite(Number(value))
    ? Number(value).toLocaleString()
    : '—'
})

const previousInspectionLabel = computed(() => {
  if (previousInspection.value?.odometer == null || !previousInspection.value?.created_at) return ''
  const when = formatDateTime(
    previousInspection.value?.submitted_at || previousInspection.value?.created_at,
    store.language,
  )
  return `Previous report: ${Number(previousInspection.value.odometer).toLocaleString()} ${companyOdometerUnit.value} · ${when}`
})

const dailyMileageLabel = computed(() => {
  const currentOdometer = Number(inspection.value?.odometer)
  const previousOdometer = Number(previousInspection.value?.odometer)

  if (!Number.isFinite(currentOdometer) || !Number.isFinite(previousOdometer)) return ''

  const distance = currentOdometer - previousOdometer
  if (!Number.isFinite(distance) || distance < 0) return ''

  return `+${Math.round(distance).toLocaleString()} ${companyOdometerUnit.value}`
})

const metricCounts = computed(() => {
  const rows = results.value
  return {
    pass: rows.filter((r) => r.result === 'pass').length,
    fail: rows.filter((r) => r.result === 'fail').length,
    na: rows.filter((r) => r.result === 'not_applicable').length,
    photos: galleryPhotos.value.length,
    items: rows.length,
  }
})

const shortInspectionId = computed(() => {
  const id = inspection.value?.id
  return id ? String(id).slice(0, 8) : ''
})

const typeLabel = computed(() =>
  inspection.value?.type === 'post-trip' ? store.t('postTrip') : store.t('preTrip')
)

const submittedLabel = computed(() =>
  formatDateTime(inspection.value?.submitted_at || inspection.value?.created_at || null, store.language)
)

const signedAtLabel = computed(() =>
  formatDateTime(inspection.value?.signed_at || inspection.value?.submitted_at || inspection.value?.created_at || null, store.language)
)

const signerLabel = computed(() => {
  const driver = relation(inspection.value?.drivers)
  return driver?.name || driver?.email || 'Driver'
})

const overallResult = computed(() => {
  if (inspection.value?.status === 'draft') return 'draft'
  // Тільки реальний результат чекліста, fraud не враховується
  return results.value.some((row) => row.result === 'fail') ? 'fail' : 'pass'
})

const overallResultClass = computed(() => resultPillClass(overallResult.value))
const overallResultLabel = computed(() => resultValueLabel(overallResult.value))

const galleryPhotos = computed(() => {
  return results.value.flatMap((row) =>
    (row.photoUrls || []).map((url: string, index: number) => ({
      url,
      rowId: row.id,
      photoIndex: index,
      title: row.title,
      result: row.result,
      comment: row.comment,
      sortOrder: row.sortOrder,
      verification: findPhotoVerification(row.id, index),
    }))
  )
})

const fraudSummary = computed(() => {
  const records = photoVerifications.value || []
  if (!records.length) {
    return {
      total: 0,
      maxRisk: 0,
      highRisk: 0,
      suspicious: 0,
      needsReview: 0,
      ok: 0,
      topFlags: [] as string[],
    }
  }

  const counts = {
    highRisk: 0,
    suspicious: 0,
    needsReview: 0,
    ok: 0,
  }
  const flagCounter = new Map<string, number>()
  let maxRisk = 0

  for (const row of records) {
    const risk = Number(row.risk_score || 0)
    if (risk > maxRisk) maxRisk = risk

    const level = String(row.risk_level || row.verification_status || 'ok')
    if (level === 'high-risk') counts.highRisk += 1
    else if (level === 'suspicious') counts.suspicious += 1
    else if (level === 'needs-review') counts.needsReview += 1
    else counts.ok += 1

    for (const flag of Array.isArray(row.flags) ? row.flags : []) {
      flagCounter.set(flag, (flagCounter.get(flag) || 0) + 1)
    }
  }

  const topFlags = [...flagCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flag]) => flag)

  return {
    total: records.length,
    maxRisk,
    highRisk: counts.highRisk,
    suspicious: counts.suspicious,
    needsReview: counts.needsReview,
    ok: counts.ok,
    topFlags,
  }
})

const suspiciousPhotos = computed(() => {
  return photoVerifications.value
    .filter((row) => Number(row.risk_score || 0) > 20)
    .sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0))
    .slice(0, 6)
})

const duplicateComparisonRows = computed(() => {
  return suspiciousPhotos.value
    .map((row) => {
      const referenceId = row.exact_duplicate_of_id || row.visual_duplicate_of_id
      if (!referenceId) return null
      const previous = verificationById.value[String(referenceId)]
      if (!previous?.photo_url || !row.photo_url) return null
      return {
        current: row,
        previous,
        duplicateType: row.exact_duplicate_of_id ? 'exact' : 'visual',
      }
    })
    .filter((pair): pair is { current: any; previous: any; duplicateType: string } => pair !== null)
})

function displayDriverName(row: any) {
  const driver = relation(row?.drivers)
  if (!driver) return 'Unknown driver'
  return driver.name || driver.email || 'Unknown driver'
}

function displayVehicleLabel(row: any) {
  const vehicle = relation(row?.vehicles)
  if (!vehicle) return `Vehicle ${row?.vehicle_id || 'unknown'}`

  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ')
  const unit = vehicle.unit ? `#${vehicle.unit}` : ''
  const plate = vehicle.plate || ''

  return [makeModel, unit, plate].filter(Boolean).join(' · ') || `Vehicle ${row?.vehicle_id || 'unknown'}`
}

function duplicateOriginSummary(row: any) {
  if (!row) return 'Original source record is unavailable.'

  const when = formatDateTime(row.uploaded_at || row.created_at || null, store.language)
  const who = displayDriverName(row)
  const where = displayVehicleLabel(row)

  return `Original first seen: ${when} · ${who} · ${where}`
}

function close() {
  emit('update:modelValue', false)
}

async function handleDelete() {
  deleteError.value = ''

  if (!inspection.value?.id) {
    deleteError.value = 'Inspection id is missing.'
    return
  }

  if (!deleteEmail.value || !deletePassword.value) {
    deleteError.value = 'Email and password are required.'
    return
  }

  try {
    const response = await fetch('/api/admin/delete-inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionIds: [inspection.value.id],
        adminEmail: deleteEmail.value,
        adminPassword: deletePassword.value,
      }),
    })

    const payload = await response.json().catch(() => ({} as any))

    if (!response.ok) {
      if (response.status === 502 || response.status === 503) {
        deleteError.value = 'Deletion backend is unavailable (502/503). Restart backend: npm run dev:backend.'
      } else {
        deleteError.value = payload?.error || `Delete failed (HTTP ${response.status})`
      }
      return
    }

    showDeleteModal.value = false
    deleteEmail.value = ''
    deletePassword.value = ''
    deleteError.value = ''
    close()
  } catch (requestError: any) {
    deleteError.value = requestError?.message || 'Delete failed'
  }
}

async function runPdfAction(action: 'download' | 'preview' | 'share') {
  if (!inspection.value?.id) return

  pdfAction.value = action
  pdfError.value = ''

  try {
    if (action === 'preview') {
      await previewInspectionReportPdf(inspection.value.id, store.language)
    } else if (action === 'share') {
      await shareInspectionReportPdf(inspection.value.id, store.language)
    } else {
      await downloadInspectionReportPdf(inspection.value.id, store.language)
    }
  } catch (actionError: any) {
    pdfError.value = actionError?.message || store.t('reportPdfActionFailed')
  } finally {
    pdfAction.value = null
  }
}

function findPhotoVerification(inspectionResultId: string, photoIndex: number) {
  return photoVerifications.value.find(
    (row) => row.inspection_result_id === inspectionResultId && Number(row.photo_index) === photoIndex
  ) || null
}

function fraudLevelClass(level: string | null) {
  if (level === 'high-risk') return 'badge-red'
  if (level === 'suspicious') return 'badge-orange'
  if (level === 'needs-review') return 'badge-yellow'
  return 'badge-green'
}

function fraudLevelLabel(level: string | null) {
  if (level === 'high-risk') return store.t('antiFraudHighRisk')
  if (level === 'suspicious') return store.t('antiFraudSuspicious')
  if (level === 'needs-review') return store.t('antiFraudNeedsReview')
  return store.t('antiFraudOk')
}

function fraudFlagLabel(flag: string) {
  if (flag === 'EXACT_DUPLICATE') return store.t('antiFraudFlagExactDuplicate')
  if (flag === 'VISUAL_DUPLICATE') return store.t('antiFraudFlagVisualDuplicate')
  if (flag === 'PHOTO_TAKEN_BEFORE_INSPECTION') return store.t('antiFraudFlagOldExif')
  if (flag === 'DEVICE_CHANGED') return store.t('antiFraudFlagDeviceChanged')
  if (flag === 'NO_EXIF') return store.t('antiFraudFlagNoExif')
  if (flag === 'FILE_NAME_REUSED') return store.t('antiFraudFlagFileNameReused')
  if (flag === 'GPS_OUTLIER') return store.t('antiFraudFlagGpsOutlier')
  if (flag === 'NO_EMBEDDED_BINARY') return 'Photo metadata source is limited (non-data URL input).'
  if (flag === 'ANALYSIS_ERROR') return 'Photo analysis partially failed.'
  return flag
}

function fraudVerdict(row: any) {
  const flags = Array.isArray(row?.flags) ? row.flags : []

  if (flags.includes('EXACT_DUPLICATE')) {
    return store.t('antiFraudVerdictExactDuplicate')
  }

  if (flags.includes('VISUAL_DUPLICATE')) {
    return store.t('antiFraudVerdictVisualDuplicate')
  }

  if (flags.includes('PHOTO_TAKEN_BEFORE_INSPECTION')) {
    return store.t('antiFraudVerdictOldExif')
  }

  if (flags.includes('DEVICE_CHANGED')) {
    return store.t('antiFraudVerdictDeviceChanged')
  }

  if (flags.includes('NO_EXIF')) {
    return store.t('antiFraudVerdictNoExif')
  }

  if (flags.includes('FILE_NAME_REUSED')) {
    return store.t('antiFraudVerdictFileNameReused')
  }

  if (flags.includes('GPS_OUTLIER')) {
    return store.t('antiFraudVerdictGpsOutlier')
  }

  const score = Number(row?.risk_score || 0)
  if (score > 80) return store.t('antiFraudVerdictHighRisk')
  if (score > 50) return store.t('antiFraudVerdictSuspicious')
  if (score > 20) return store.t('antiFraudVerdictNeedsReview')
  return store.t('antiFraudVerdictNoIndicators')
}

function isMissingPhotoVerificationTableError(message?: string | null) {
  const value = String(message || '').toLowerCase()
  return value.includes('inspection_photo_verifications')
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

function duplicatePointsToNewerPhoto(row: any, inspectionCreatedAt: string | null | undefined) {
  const inspectionTs = toTimestamp(inspectionCreatedAt)
  if (inspectionTs == null) return false

  const exactTs = toTimestamp(row?.details?.exact_duplicate?.uploaded_at)
  const visualTs = toTimestamp(row?.details?.visual_duplicate?.uploaded_at)

  return (exactTs != null && exactTs > inspectionTs) || (visualTs != null && visualTs > inspectionTs)
}

async function reanalyzeFraud() {
  const inspectionId = props.inspectionId
  if (!inspectionId || reanalyzing.value) return
  const companyId = inspection.value?.company_id
  if (!companyId) return

  reanalyzing.value = true
  fraudLoadError.value = null
  try {
    const backfillPhotos = results.value.flatMap((row: any) =>
      (row.photoUrls || []).map((url: string, photoIndex: number) => ({
        inspectionResultId: row.id,
        photoIndex,
        dataUrl: url,
        uploadedAt: inspection.value?.created_at || new Date().toISOString(),
      }))
    )
    if (!backfillPhotos.length) return

    await analyzeAndStoreInspectionPhotos({
      companyId,
      inspectionId,
      driverId: inspection.value?.driver_id || null,
      vehicleId: inspection.value?.vehicle_id || null,
      inspectionCreatedAt: inspection.value?.created_at || null,
      photos: backfillPhotos,
    })

    const reloaded = await supabase
      .from('inspection_photo_verifications')
      .select('id, inspection_id, photo_url, inspection_result_id, photo_index, risk_score, risk_level, verification_status, flags, exact_duplicate_of_id, visual_duplicate_of_id, details, uploaded_at, gps_latitude, gps_longitude, exif_taken_at, exif_device_make, exif_device_model')
      .eq('inspection_id', inspectionId)

    if (reloaded.error) {
      console.warn('[InspectionReportModal] re-analyze reload failed', reloaded.error)
      fraudLoadError.value = `Re-analyze failed: ${reloaded.error.message}`
    } else {
      photoVerifications.value = Array.isArray(reloaded.data) ? reloaded.data : []
      const localMap: Record<string, any> = {}
      for (const row of photoVerifications.value) {
        if (row?.id) localMap[String(row.id)] = row
      }
      verificationById.value = localMap
    }
  } catch (err: any) {
    console.warn('[InspectionReportModal] re-analyze failed', err)
    fraudLoadError.value = `Re-analyze failed: ${err?.message || 'unknown error'}`
  } finally {
    reanalyzing.value = false
  }
}

async function fetchInspection(inspectionId: string) {
  loading.value = true
  error.value = null
  inspection.value = null
  results.value = []
  photoVerifications.value = []
  verificationById.value = {}
  fraudLoadError.value = null
  previousInspection.value = null

  let { data, error: inspectionError } = await supabase
    .from('inspections')
    .select(`
      id,
      company_id,
      vehicle_id,
      driver_id,
      type,
      status,
      odometer,
      created_at,
      submitted_at,
      signature_data_url,
      signed_at,
      vehicles (
        unit,
        make,
        model,
        plate,
        vin,
        photo_url
      ),
      drivers!inspections_driver_id_fkey (
        name,
        email
      ),
      inspection_results (
        id,
        result,
        comment,
        photo_urls,
        inspection_template_items (
          title,
          sort_order,
          requires_photo,
          inspection_item_categories (
            name
          )
        )
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
        vehicle_id,
        driver_id,
        type,
        status,
        odometer,
        created_at,
        submitted_at,
        vehicles (
          unit,
          make,
          model,
          plate,
          vin,
          photo_url
        ),
        drivers!inspections_driver_id_fkey (
          name,
          email
        ),
        inspection_results (
          id,
          result,
          comment,
          photo_urls,
          inspection_template_items (
            title,
            sort_order,
            requires_photo,
            inspection_item_categories (
              name
            )
          )
        )
      `)
      .eq('id', inspectionId)
      .single()
    data = retry.data as any
    inspectionError = retry.error
  }

  if (inspectionError || !data) {
    error.value = inspectionError?.message || 'Inspection details could not be loaded.'
    loading.value = false
    return
  }

  const localFallbackSignature = readSignatureFallback(inspectionId)
  const fallbackSignature =
    localFallbackSignature || (await readSignatureFallbackFromDb(inspectionId))
  inspection.value = {
    ...data,
    signature_data_url: data?.signature_data_url || fallbackSignature?.dataUrl || null,
    signed_at: data?.signed_at || fallbackSignature?.signedAt || null,
  }

  const inspectionCreatedAt = data?.submitted_at || data?.created_at
  if (data?.vehicle_id && inspectionCreatedAt) {
    const { data: previousData } = await supabase
      .from('inspections')
      .select('id, odometer, created_at, submitted_at')
      .eq('vehicle_id', data.vehicle_id)
      .not('odometer', 'is', null)
      .lt('created_at', data.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    previousInspection.value = previousData || null
  }
  results.value = relationArray(data.inspection_results)
    .map((row: any) => {
      const item = relation(row.inspection_template_items)
      const photoUrls = normalizePhotoUrls(row.photo_urls)
      return {
        id: row.id,
        title: item?.title || 'Checklist item',
        sortOrder: Number(item?.sort_order || 0),
        category: relation(item?.inspection_item_categories)?.name || '',
        requiresPhoto: Boolean(item?.requires_photo),
        result: row.result,
        comment: row.comment || '',
        photoUrls,
        photoCount: photoUrls.length,
      }
    })
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)

  if (canViewFraudInsights.value) {
    let { data: verificationData, error: verificationError } = await supabase
      .from('inspection_photo_verifications')
      .select('id, inspection_id, photo_url, inspection_result_id, photo_index, risk_score, risk_level, verification_status, flags, exact_duplicate_of_id, visual_duplicate_of_id, details, uploaded_at, gps_latitude, gps_longitude, exif_taken_at, exif_device_make, exif_device_model')
      .eq('inspection_id', inspectionId)

    const shouldRecomputeFraud =
      !verificationError &&
      Array.isArray(verificationData) &&
      verificationData.some((row: any) => duplicatePointsToNewerPhoto(row, inspection.value?.created_at))

    // Records made before the GPS-extraction fix have exif_taken_at filled but gps_* NULL.
    // Re-run analysis once so existing photos get their GPS metadata populated.
    const needsGpsBackfill =
      !verificationError &&
      Array.isArray(verificationData) &&
      verificationData.some((row: any) => row?.exif_taken_at && row?.gps_latitude == null && row?.gps_longitude == null)

    const shouldBackfillFraud =
      !verificationError &&
      Array.isArray(verificationData) &&
      (verificationData.length === 0 || shouldRecomputeFraud || needsGpsBackfill)
    if (shouldBackfillFraud) {
      const backfillPhotos = results.value.flatMap((row: any) =>
        (row.photoUrls || []).map((url: string, photoIndex: number) => ({
          inspectionResultId: row.id,
          photoIndex,
          dataUrl: url,
          uploadedAt: inspection.value?.created_at || new Date().toISOString(),
        }))
      )

      const companyId = inspection.value?.company_id
      if (companyId && backfillPhotos.length > 0) {
        try {
          await analyzeAndStoreInspectionPhotos({
            companyId,
            inspectionId,
            driverId: inspection.value?.driver_id || null,
            vehicleId: inspection.value?.vehicle_id || null,
            inspectionCreatedAt: inspection.value?.created_at || null,
            photos: backfillPhotos,
          })

          const reloaded = await supabase
            .from('inspection_photo_verifications')
            .select('id, inspection_id, photo_url, inspection_result_id, photo_index, risk_score, risk_level, verification_status, flags, exact_duplicate_of_id, visual_duplicate_of_id, details, uploaded_at, gps_latitude, gps_longitude, exif_taken_at, exif_device_make, exif_device_model')
            .eq('inspection_id', inspectionId)

          verificationData = reloaded.data
          verificationError = reloaded.error
        } catch (backfillError: any) {
          console.warn('[InspectionReportModal] anti-fraud backfill failed', backfillError)
          fraudLoadError.value = `Anti-fraud backfill failed: ${backfillError?.message || 'unknown error'}`
        }
      }
    }

    if (verificationError) {
      if (!isMissingPhotoVerificationTableError(verificationError.message)) {
        console.warn('[InspectionReportModal] failed to load anti-fraud records', verificationError)
        fraudLoadError.value = 'Anti-fraud records could not be loaded due to permissions or schema mismatch.'
      } else {
        fraudLoadError.value = 'Anti-fraud table is missing in the current database schema.'
      }
      photoVerifications.value = []
    } else {
      photoVerifications.value = Array.isArray(verificationData) ? verificationData : []
      const localMap: Record<string, any> = {}

      for (const row of photoVerifications.value) {
        if (row?.id) localMap[String(row.id)] = row
      }

      const referencedIds = photoVerifications.value
        .flatMap((row) => [row?.exact_duplicate_of_id, row?.visual_duplicate_of_id])
        .filter(Boolean)

      const uniqueReferencedIds = [...new Set(referencedIds)]

      if (uniqueReferencedIds.length) {
        const { data: referenceRows, error: referenceError } = await supabase
          .from('inspection_photo_verifications')
          .select(`
            id,
            inspection_id,
            photo_url,
            risk_score,
            risk_level,
            verification_status,
            uploaded_at,
            created_at,
            driver_id,
            vehicle_id,
            drivers (
              name,
              email
            ),
            vehicles (
              unit,
              make,
              model,
              plate
            )
          `)
          .in('id', uniqueReferencedIds)

        if (referenceError) {
          console.warn('[InspectionReportModal] failed to load duplicate photo references', referenceError)
        } else {
          for (const row of Array.isArray(referenceRows) ? referenceRows : []) {
            if (row?.id) localMap[String(row.id)] = row
          }
        }
      }

      verificationById.value = localMap
    }
  }

  loading.value = false
}

function openPhotoLightbox(index: number) {
  lightboxPhotos.value = galleryPhotos.value.map((photo) => photo.url)
  lightboxStartIndex.value = index
  photoLightboxOpen.value = true
}

function openRowPhotosLightbox(urls: string[], startIndex: number) {
  if (!Array.isArray(urls) || !urls.length) return
  lightboxPhotos.value = [...urls]
  lightboxStartIndex.value = Math.max(0, Math.min(startIndex, urls.length - 1))
  photoLightboxOpen.value = true
}

function openPairPhotoLightbox(pair: any, target: 'previous' | 'current') {
  const previousUrl = pair?.previous?.photo_url
  const currentUrl = pair?.current?.photo_url
  const photos = [previousUrl, currentUrl].filter(Boolean)
  if (!photos.length) return

  lightboxPhotos.value = photos
  lightboxStartIndex.value = target === 'current' && photos.length > 1 ? 1 : 0
  photoLightboxOpen.value = true
}

function resultPillClass(result: string | null) {
  if (result === 'pass') return 'badge-green'
  if (result === 'fail') return 'badge-red'
  if (result === 'not_applicable') return 'badge-gray'
  return 'badge-yellow'
}

function checklistRowAccent(result: string | null) {
  if (result === 'pass') return 'border-green-400'
  if (result === 'fail') return 'border-red-400'
  if (result === 'not_applicable') return 'border-gray-300'
  return 'border-yellow-400'
}

function riskScoreColor(score: number) {
  if (score >= 80) return 'text-red-600 dark:text-red-400'
  if (score >= 50) return 'text-orange-600 dark:text-orange-400'
  if (score >= 20) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

function riskBarColor(score: number) {
  if (score >= 80) return 'bg-red-500'
  if (score >= 50) return 'bg-orange-500'
  if (score >= 20) return 'bg-yellow-500'
  return 'bg-green-500'
}

function resultValueLabel(result: string | null) {
  if (result === 'pass') return store.t('statusPassed')
  if (result === 'fail') return store.t('statusFailed')
  if (result === 'not_applicable') return 'N/A'
  return store.t('statusDraft')
}

function relation(value: any) {
  return Array.isArray(value) ? value[0] : value
}

function relationArray(value: any) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
</script>