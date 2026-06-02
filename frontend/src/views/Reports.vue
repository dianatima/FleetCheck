<template>
  <AppLayout title="Reports">
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
      <div
        v-for="s in summaryStats"
        :key="s.label"
        class="card p-4 text-center"
      >
        <div class="text-2xl font-bold" :class="s.color">{{ s.value }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ s.label }}
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-5">
      <button
        v-if="store.role === 'admin' || authStore.role === 'owner'"
        class="btn-danger px-4 py-2 rounded-lg text-sm font-semibold mb-2"
        @click="showBulkDeleteModal = true"
      >
        {{ store.t('delete') }} {{ store.t('reports') }}
	  </button>

      <template v-if="showBulkDeleteModal">
        <Teleport to="body">
          <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div class="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold mb-2">{{ store.t('delete') }} {{ store.t('reports') }}</h3>
              <p class="text-sm mb-4">Виберіть діапазон дат для видалення звітів. Для підтвердження введіть email і пароль адміністратора.</p>
              <form @submit.prevent="handleBulkDelete">
                <div class="mb-3">
                  <label class="block text-xs mb-1">{{ store.t('from') }}</label>
                  <input v-model="bulkDeleteStart" type="date" class="input-field w-full" />
                </div>
                <div class="mb-3">
                  <label class="block text-xs mb-1">{{ store.t('to') }}</label>
                  <input v-model="bulkDeleteEnd" type="date" class="input-field w-full" />
                </div>
                <div class="mb-3">
                  <label class="block text-xs mb-1">{{ store.t('driver') }}</label>
                  <select v-model="bulkDeleteDriver" class="input-field w-full">
                    <option value="">{{ store.t('allDrivers') || 'All drivers' }}</option>
                    <option v-for="d in uniqueDrivers" :key="d.id" :value="d.id">{{ d.name }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="block text-xs mb-1">{{ store.t('type') }}</label>
                  <select v-model="bulkDeleteType" class="input-field w-full">
                    <option value="">{{ store.t('allTypes') }}</option>
                    <option value="pre-trip">{{ store.t('preTrip') }}</option>
                    <option value="post-trip">{{ store.t('postTrip') }}</option>
                  </select>
                </div>
                <div class="mb-3 flex items-center gap-2">
                  <input id="fraudOnly" v-model="bulkDeleteFraud" type="checkbox" class="form-checkbox" />
                  <label for="fraudOnly" class="text-xs">{{ store.t('fraudFlagged') }}</label>
                </div>
                <div class="mb-3">
                  <label class="block text-xs mb-1">Email</label>
                  <input v-model="bulkDeleteEmail" type="email" class="input-field w-full" required />
                </div>
                <div class="mb-3">
                  <label class="block text-xs mb-1;">{{ store.t('password') }}</label>
                  <input v-model="bulkDeletePassword" type="password" class="input-field w-full" required />
                </div>
                <div class="mb-2 text-xs text-gray-500">{{ store.t('delete') }}: <b>{{ bulkDeleteCount }}</b> {{ store.t('reports') }}</div>
                <div v-if="bulkDeleteError" class="text-xs text-red-500 mb-2">{{ bulkDeleteError }}</div>
                <div class="flex gap-2 justify-end">
                  <button type="button" class="btn-secondary" @click="showBulkDeleteModal = false">{{ store.t('cancel') }}</button>
                  <button type="submit" class="btn-danger" :disabled="bulkDeleteLoading">
                    {{ bulkDeleteLoading ? 'Deleting...' : store.t('delete') }}
                  </button>
                </div>
              </form>
            <!-- JS-логіка переміщена у <script setup> -->
            </div>
          </div>
        </Teleport>
      </template>
      <!-- JS-логіка переміщена у <script setup> -->
      <div class="relative w-full sm:flex-1 sm:min-w-[220px]">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="search"
          class="input-field pl-9 py-1.5 text-sm"
          placeholder="Search reports..."
        />
      </div>
      <div class="flex w-full items-center gap-2 flex-wrap sm:w-auto sm:flex-nowrap">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select
          v-model="filterResult"
          class="input-field py-1.5 text-sm sm:w-40"
          aria-label="Report status"
        >
          <option value="all">{{ store.t("allResults") }}</option>
          <option value="pass">{{ store.t("statusPassed") }}</option>
          <option value="fail">{{ store.t("statusFailed") }}</option>
          <option value="draft">{{ store.t("statusDraft") }}</option>
          <option value="needs-review">
            {{ store.t("statusNeedsReview") }}
          </option>
          <option value="fraud-flagged">{{ store.t("fraudFlagged") }}</option>
        </select>
        <select
          v-model="filterType"
          class="input-field py-1.5 text-sm sm:w-36"
          aria-label="Inspection type"
        >
          <option value="all">{{ store.t("allTypes") }}</option>
          <option value="pre-trip">{{ store.t("preTrip") }}</option>
          <option value="post-trip">{{ store.t("postTrip") }}</option>
        </select>
      </div>
      <div class="flex w-full items-center gap-2 flex-wrap sm:w-auto sm:flex-nowrap">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Date range:
        </span>
        <BaseDateInput
          v-model="startDate"
          input-class="py-1.5 text-sm w-full sm:w-36"
        />
        <span class="text-gray-400 text-sm">-</span>
        <BaseDateInput
          v-model="endDate"
          input-class="py-1.5 text-sm w-full sm:w-36"
        />
      </div>
    </div>

    <div
      v-if="vehicleFilterId"
      class="mb-5 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
    >
      <span>Vehicle: {{ vehicleFilterLabel }}</span>
      <button
        type="button"
        class="font-medium hover:underline"
        @click="clearVehicleFilter"
      >
        Clear
      </button>
    </div>

    <div
      v-if="driverFilterId"
      class="mb-5 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300"
    >
      <span>Driver: {{ driverFilterLabel }}</span>
      <button
        type="button"
        class="font-medium hover:underline"
        @click="clearDriverFilter"
      >
        Clear
      </button>
    </div>

    <div v-if="error" class="card p-4 mb-5 text-sm text-red-500">
      {{ error }}
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100/80 dark:border-gray-800">
        <h2 class="text-sm font-medium text-gray-700 dark:text-gray-200">
          Reports
        </h2>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header-row">
              <th class="table-th w-8">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
              </th>
              <th v-for="h in reportHeaders" :key="h" class="table-th">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedReports.length === 0">
              <td
                :colspan="reportHeaders.length"
                class="text-center py-12 text-sm text-gray-400"
              >
                {{ loading ? "Loading reports..." : store.t("noReportsFound") }}
              </td>
            </tr>
            <tr
              v-for="r in paginatedReports"
              :key="r.id"
              class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
              :class="[
                (r.reviewStatus === 'needs-review' || r.fraudSuspicious) ? 'bg-yellow-50/40 dark:bg-yellow-900/5' : '',
                selectedReportIds.includes(r.id) ? 'ring-2 ring-blue-400/40 dark:ring-blue-600/40' : ''
              ]"
            >
              <td class="px-2 py-3 text-center">
                <input type="checkbox" :checked="selectedReportIds.includes(r.id)" @change="toggleSelectReport(r.id)" @click.stop />
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ r.date }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-9 w-9 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <img
                      v-if="r.thumbnailUrl"
                      :src="r.thumbnailUrl"
                      alt=""
                      class="h-full w-full object-cover"
                      @error="hideBrokenThumb"
                    />
                    <Truck v-else :size="13" class="text-gray-400" />
                  </div>
                  <span
                    class="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >{{ r.vehicle }}</span
                  >
                </div>
              </td>
              <td
                class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap"
              >
                {{ r.driver }}
              </td>
              <td
                class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap"
              >
                {{ typeLabel(r.type) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <FileEdit
                    v-if="normalizedResult(r) === 'draft'"
                    :size="13"
                    class="text-amber-500"
                  />
                  <CheckCircle
                    v-else-if="normalizedResult(r) === 'pass'"
                    :size="13"
                    class="text-green-500"
                  />
                  <XCircle v-else :size="13" class="text-red-500" />
                  <span :class="resultBadge(r)" class="text-xs">{{
                    resultLabel(r)
                  }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span :class="reviewBadge(r.reviewStatus)" class="text-xs">{{
                  reviewLabel(r.reviewStatus)
                }}</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="r.issues > 0" class="badge-red">{{
                  r.issues
                }}</span>
                <span v-else class="text-gray-400 text-xs">-</span>
              </td>
              <td class="px-4 py-3">
                <div
                  v-if="r.photos > 0"
                  class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                >
                  <Camera :size="12" /> {{ r.photos }}
                </div>
                <span v-else class="text-gray-400 text-xs">-</span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="r.fraudSuspicious ? 'badge-red' : 'badge-green'"
                  class="text-xs"
                >
                  {{ r.fraudSuspicious ? store.t("fraudFlagged") : store.t("clean") }}
                </span>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {{ store.t("antiFraudRisk") }} {{ r.fraudMaxRisk }}/100
                </p>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button
                    v-if="r.reviewStatus === 'needs-review' && r.reviewIssueId"
                    @click.stop="reviewIssue(r)"
                    class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors whitespace-nowrap"
                  >
                    <ClipboardCheck :size="12" /> Review
                  </button>
                  <button
                    @click.stop="viewReport(r)"
                    title="View full report"
                    class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <FileText :size="13" />
                  </button>
                  <button
                    @click.stop="downloadReport(r)"
                    :title="downloadingId === r.id ? 'Preparing PDF...' : 'Download PDF'"
                    :disabled="downloadingId === r.id"
                    class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-wait transition-colors"
                  >
                    <Download :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        <div v-if="paginatedReports.length === 0" class="px-4 py-12 text-center text-sm text-gray-400">
          {{ loading ? "Loading reports..." : store.t("noReportsFound") }}
        </div>
        <div
          v-for="r in paginatedReports"
          :key="r.id"
          class="p-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/45"
          :class="(r.reviewStatus === 'needs-review' || r.fraudSuspicious) ? 'bg-yellow-50/40 dark:bg-yellow-900/5' : ''"
          role="button"
          tabindex="0"
          @click="viewReport(r)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="mobile-card-title truncate">{{ r.vehicle }}</p>
              <p class="mobile-card-meta">{{ r.driver }} · {{ typeLabel(r.type) }}</p>
              <p class="mobile-card-meta">{{ r.date }}</p>
            </div>
            <div class="h-12 w-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <img
                v-if="r.thumbnailUrl"
                :src="r.thumbnailUrl"
                alt=""
                class="h-full w-full object-cover"
                @error="hideBrokenThumb"
              />
              <Truck v-else :size="15" class="text-gray-400" />
            </div>
            <span :class="resultBadge(r)" class="flex-shrink-0 text-xs">
              {{ resultLabel(r) }}
            </span>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
              <p class="text-gray-400">Review</p>
              <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">
                {{ reviewLabel(r.reviewStatus) }}
              </p>
            </div>
            <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
              <p class="text-gray-400">Issues / photos</p>
              <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">
                {{ r.issues }} issues · {{ r.photos }} photos
              </p>
            </div>
            <div class="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
              <p class="text-gray-400">Fraud</p>
              <p class="mt-1 font-medium text-gray-700 dark:text-gray-200">
                {{ r.fraudSuspicious ? store.t("fraudFlagged") : store.t("clean") }} · {{ store.t("antiFraudRisk") }} {{ r.fraudMaxRisk }}/100
              </p>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3" @click.stop>
            <button
              v-if="r.reviewStatus === 'needs-review' && r.reviewIssueId"
              class="btn-secondary w-full text-sm"
              @click.stop="reviewIssue(r)"
            >
              <ClipboardCheck :size="15" />
              Review
            </button>
            <button class="btn-secondary w-full text-sm" @click.stop="viewReport(r)">
              <FileText :size="15" />
              Open
            </button>
            <button
              class="btn-secondary w-full text-sm"
              :disabled="downloadingId === r.id"
              @click.stop="downloadReport(r)"
            >
              <Download :size="15" />
              PDF
            </button>
          </div>
        </div>
      </div>
      <BaseTablePagination
        :total="filtered.length"
        :current-page="page"
        :page-size="pageSize"
        @update:current-page="page = $event"
        @update:page-size="setPageSize"
      />
    </div>

    <InspectionReportModal
      v-model="inspectionModalOpen"
      :inspection-id="selectedInspectionId"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Filter,
  Search,
  Download,
  Truck,
  CheckCircle,
  XCircle,
  Camera,
  FileText,
  ClipboardCheck,
  File as FileEdit,
} from "lucide-vue-next";
import AppLayout from "../components/layout/AppLayout.vue";
import BaseTablePagination from "@/components/shared/BaseTablePagination.vue";
import BaseDateInput from "@/components/shared/BaseDateInput.vue";
import InspectionReportModal from "@/components/shared/InspectionReportModal.vue";
import { useAppStore } from "../stores/app";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/dateFormat";
import { downloadInspectionReportPdf } from "@/lib/reportPdf";
import { analyzeAndStoreInspectionPhotos } from "@/lib/photoFraud";
import { firstUsablePhotoUrl, normalizePhotoUrls } from "@/lib/photoUrls";

type ReportResult = "pass" | "fail" | "draft";
type ReviewStatus =
  | "none"
  | "needs-review"
  | "in-repair"
  | "fixed"
  | "rejected";

interface Report {
  id: string;
  vehicleId: string;
  driverId: string;
  createdAt: string;
  date: string;
  vehicle: string;
  driver: string;
  thumbnailUrl: string | null;
  type: "pre-trip" | "post-trip";
  result: ReportResult;
  reviewStatus: ReviewStatus;
  reviewIssueId: string | null;
  issues: number;
  photos: number;
  fraudSuspicious: boolean;
  fraudMaxRisk: number;
  status: "draft" | "submitted" | "approved" | "needs-review" | "rejected";
}

const store = useAppStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const reports = ref<Report[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const filterType = ref("all");
const filterResult = ref("all");
const search = ref("");
const startDate = ref("");
const endDate = ref("");
const page = ref(1);
const pageSize = ref(10);
const downloadingId = ref<string | null>(null);
const inspectionModalOpen = ref(false);
const selectedInspectionId = ref<string | null>(null);
const vehicleFilterId = computed(() => String(route.query.vehicle_id || ""));
const driverFilterId = computed(() => String(route.query.driver_id || ""));
const vehicleFilterLabel = computed(() => {
  if (!vehicleFilterId.value) return "";
  return (
    reports.value.find((report) => report.vehicleId === vehicleFilterId.value)
      ?.vehicle || "Selected vehicle"
  );
});
const driverFilterLabel = computed(() => {
  if (!driverFilterId.value) return "";
  return (
    reports.value.find((report) => report.driverId === driverFilterId.value)
      ?.driver || "Selected driver"
  );
});

onMounted(fetchReports);


watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await fetchReports();
  },
);

// Якщо модалка закрилась — оновити список звітів для синхронізації статусу
watch(
  inspectionModalOpen,
  async (open) => {
    if (!open) {
      await fetchReports();
    }
  }
);

watch(vehicleFilterId, () => {
  page.value = 1;
});

watch(driverFilterId, () => {
  page.value = 1;
});

async function fetchReports() {
  if (!authStore.companyId) {
    reports.value = [];
    return;
  }

  loading.value = true;
  error.value = null;

  const { data, error: reportsError } = await supabase
    .from("inspections")
    .select(
      `
      id,
      company_id,
      vehicle_id,
      driver_id,
      type,
      status,
      created_at,
      submitted_at,
      vehicles (
        unit,
        make,
        model,
        plate,
        photo_url
      ),
      drivers!inspections_driver_id_fkey (
        id,
        name
      ),
      inspection_results (
        id,
        result,
        photo_urls,
        inspection_template_items (
          title
        )
      ),
      issues (
        id,
        status
      )
    `,
    )
    .eq("company_id", authStore.companyId)
    .order("created_at", { ascending: false });

  if (reportsError) {
    error.value = reportsError.message;
    reports.value = [];
    loading.value = false;
    return;
  }

  const inspections = normalizeInspectionRows(data || []);
  const inspectionIds = inspections.map((inspection: any) => inspection.id).filter(Boolean);
  const fraudByInspection = new Map<string, { suspicious: boolean; maxRisk: number }>();

  if (inspectionIds.length) {
    let { data: fraudRows, error: fraudError } = await supabase
      .from("inspection_photo_verifications")
      .select("inspection_id, risk_score, flags, details")
      .in("inspection_id", inspectionIds);

    if (fraudError) {
      console.warn("[Reports] fraud summary load failed", fraudError);
    } else {
      const rows = Array.isArray(fraudRows) ? fraudRows : [];
      const groupedByInspectionId = new Map<string, any[]>();

      for (const row of rows) {
        const key = String(row?.inspection_id || "");
        if (!key) continue;
        if (!groupedByInspectionId.has(key)) groupedByInspectionId.set(key, []);
        groupedByInspectionId.get(key)!.push(row);
      }

      const recomputeTargets = inspections.filter((inspection: any) => {
        const photos = collectInspectionPhotos(inspection);
        if (!photos.length) return false;

        const inspectionRows = groupedByInspectionId.get(String(inspection.id)) || [];
        if (!inspectionRows.length) return true;

        return inspectionRows.some((row) => hasStaleDuplicateDirection(row, inspection.created_at));
      });

      if (recomputeTargets.length) {
        for (const inspection of recomputeTargets) {
          const photos = collectInspectionPhotos(inspection);
          if (!photos.length) continue;

          try {
            await analyzeAndStoreInspectionPhotos({
              companyId: authStore.companyId,
              inspectionId: inspection.id,
              driverId: inspection.driver_id || null,
              vehicleId: inspection.vehicle_id || null,
              inspectionCreatedAt: inspection.created_at || null,
              photos,
            });
          } catch (analysisError) {
            console.warn("[Reports] fraud recompute failed", analysisError);
          }
        }

        const reloaded = await supabase
          .from("inspection_photo_verifications")
          .select("inspection_id, risk_score, flags, details")
          .in("inspection_id", inspectionIds);

        if (!reloaded.error) {
          fraudRows = reloaded.data;
        }
      }

      for (const row of Array.isArray(fraudRows) ? fraudRows : []) {
        const inspectionId = String(row?.inspection_id || "");
        if (!inspectionId) continue;

        const risk = Number(row?.risk_score || 0);
        const flags = Array.isArray(row?.flags) ? row.flags : [];
        const suspicious =
          risk > 20 ||
          flags.includes("EXACT_DUPLICATE") ||
          flags.includes("VISUAL_DUPLICATE");

        const current = fraudByInspection.get(inspectionId) || {
          suspicious: false,
          maxRisk: 0,
        };

        if (risk > current.maxRisk) current.maxRisk = risk;
        if (suspicious) current.suspicious = true;

        fraudByInspection.set(inspectionId, current);
      }
    }
  }

  reports.value = inspections.map((inspection: any) =>
    toReport(inspection, fraudByInspection.get(String(inspection.id)))
  );
  loading.value = false;
}

function collectInspectionPhotos(inspection: any) {
  const rows = normalizeRelationArray(inspection?.inspection_results);
  return rows.flatMap((row: any) => {
    const photos = normalizePhotoUrls(row?.photo_urls);
    return photos.map((url: string, photoIndex: number) => ({
      inspectionResultId: row.id,
      photoIndex,
      dataUrl: url,
      uploadedAt: inspection?.created_at || null,
    }));
  });
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function hasStaleDuplicateDirection(row: any, inspectionCreatedAt: string | null | undefined) {
  const inspectionTs = toTimestamp(inspectionCreatedAt);
  if (inspectionTs == null) return false;

  const exactTs = toTimestamp(row?.details?.exact_duplicate?.uploaded_at);
  const visualTs = toTimestamp(row?.details?.visual_duplicate?.uploaded_at);

  return (exactTs != null && exactTs > inspectionTs) || (visualTs != null && visualTs > inspectionTs);
}

function toReport(
  inspection: any,
  fraudSummary?: { suspicious: boolean; maxRisk: number },
): Report {
  const vehicle = firstRelation(inspection.vehicles);
  const driver = firstRelation(inspection.drivers);
  const results = normalizeRelationArray(inspection.inspection_results);
  const issues = normalizeRelationArray(inspection.issues);
  const failed = results.some((row: any) => row.result === "fail");
  const photos = results.reduce(
    (count: number, row: any) => count + normalizePhotoUrls(row.photo_urls).length,
    0,
  );
  const thumbnailUrl = firstUsablePhotoUrl(
    vehicle?.photo_url,
    ...results.map((row: any) => row.photo_urls),
  );
  const vehicleName = `${vehicle?.make || ""} ${vehicle?.model || ""}`.trim();

  return {
    id: inspection.id,
    vehicleId: inspection.vehicle_id,
    driverId: inspection.driver_id,
    createdAt: inspection.submitted_at || inspection.created_at,
    date: formatDate(inspection.submitted_at || inspection.created_at),
    vehicle:
      [
        vehicleName,
        vehicle?.unit ? `#${vehicle.unit}` : "",
        vehicle?.plate || "",
      ]
        .filter(Boolean)
        .join(" · ") || "-",
    driver: driver?.name || "-",
    thumbnailUrl,
    type: inspection.type === "post-trip" ? "post-trip" : "pre-trip",
    status: inspection.status,
    result: inspection.status === "draft" ? "draft" : failed ? "fail" : "pass",
    reviewStatus: getReviewStatus(issues, failed, inspection.status),
    reviewIssueId:
      issues.find((issue: any) => issue.status === "under-review")?.id ||
      issues[0]?.id ||
      null,
    issues: issues.length,
    photos,
    fraudSuspicious: Boolean(fraudSummary?.suspicious),
    fraudMaxRisk: Number(fraudSummary?.maxRisk || 0),
  };
}

function getReviewStatus(
  issues: any[],
  failed: boolean,
  status: string,
): ReviewStatus {
  if (status === "draft" || !failed) return "none";
  if (issues.some((issue) => issue.status === "under-review"))
    return "needs-review";
  if (issues.some((issue) => issue.status === "in-repair")) return "in-repair";
  if (issues.length && issues.every((issue) => issue.status === "fixed"))
    return "fixed";
  if (issues.length && issues.every((issue) => issue.status === "rejected"))
    return "rejected";
  return "none";
}

function viewReport(report: Report) {
  selectedInspectionId.value = report.id;
  inspectionModalOpen.value = true;
}

function reviewIssue(report: Report) {
  if (report.reviewIssueId) router.push(`/issues/${report.reviewIssueId}`);
}

function hideBrokenThumb(event: Event) {
  (event.target as HTMLImageElement).style.display = "none";
}

function clearVehicleFilter() {
  const query = { ...route.query };
  delete query.vehicle_id;
  router.replace({ path: "/reports", query });
}

function clearDriverFilter() {
  const query = { ...route.query };
  delete query.driver_id;
  router.replace({ path: "/reports", query });
}

async function downloadReport(report: Report) {
  downloadingId.value = report.id;
  error.value = null;

  try {
    await downloadInspectionReportPdf(report.id, store.language);
  } catch (downloadError: any) {
    error.value = downloadError?.message || "Report PDF could not be downloaded.";
  } finally {
    downloadingId.value = null;
  }
}

function formatDate(value: string | null) {
  return formatDateTime(value, store.language, "-");
}

function typeLabel(type: string) {
  return type === "post-trip" ? store.t("postTrip") : store.t("preTrip");
}

function resultBadge(report: Report) {
  const normalized = normalizedResult(report);
  if (normalized === "draft") return "badge-yellow";
  return normalized === "pass" ? "badge-green" : "badge-red";
}

function resultLabel(report: Report) {
  const normalized = normalizedResult(report);
  if (normalized === "draft") return store.t("statusDraft");
  return normalized === "pass" ? store.t("pass") : store.t("fail");
}

function normalizedResult(report: Report): ReportResult {
  // Тільки реальний результат чекліста, fraudSuspicious не враховується
  if (report.status === "draft") return "draft";
  return report.result;
}

function reviewBadge(status: ReviewStatus) {
  return {
    "needs-review": "badge-yellow",
    "in-repair": "badge-orange",
    fixed: "badge-green",
    rejected: "badge-gray",
    none: "text-gray-400",
  }[status];
}

function reviewLabel(status: ReviewStatus) {
  return {
    "needs-review": store.t("statusNeedsReview"),
    "in-repair": store.t("statusInRepair"),
    fixed: store.t("statusFixed"),
    rejected: store.t("statusRejected"),
    none: "-",
  }[status];
}

function normalizeInspectionRows(rows: any[]) {
  const byId = new Map<string, any>();

  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, {
        ...row,
        inspection_results: normalizeRelationArray(row.inspection_results),
        issues: normalizeRelationArray(row.issues),
      });
      continue;
    }

    const existing = byId.get(row.id);
    existing.inspection_results = mergeById(
      existing.inspection_results,
      normalizeRelationArray(row.inspection_results),
    );
    existing.issues = mergeById(
      existing.issues,
      normalizeRelationArray(row.issues),
    );
  }

  return [...byId.values()];
}

function normalizeRelationArray(value: any) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function firstRelation(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

function mergeById(left: any[], right: any[]) {
  const byId = new Map<string, any>();
  for (const item of [...left, ...right]) {
    if (item?.id) byId.set(item.id, item);
  }
  return [...byId.values()];
}

const passCount = computed(
  () => reports.value.filter((report) => normalizedResult(report) === "pass").length,
);
const failCount = computed(
  () => reports.value.filter((report) => normalizedResult(report) === "fail").length,
);
const reviewCount = computed(
  () =>
    reports.value.filter((report) => report.reviewStatus === "needs-review")
      .length,
);
const fraudCount = computed(
  () => reports.value.filter((report) => report.fraudSuspicious).length,
);

const summaryStats = computed(() => [
  {
    label: store.t("reports"),
    value: reports.value.length,
    color: "text-gray-900 dark:text-white",
  },
  {
    label: store.t("statusPassed"),
    value: passCount.value,
    color: "text-green-600 dark:text-green-400",
  },
  {
    label: store.t("statusFailed"),
    value: failCount.value,
    color: "text-red-600 dark:text-red-400",
  },
  {
    label: store.t("statusNeedsReview"),
    value: reviewCount.value,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    label: store.t("fraudFlagged"),
    value: fraudCount.value,
    color: "text-red-600 dark:text-red-400",
  },
]);

const reportHeaders = computed(() => [
  store.t("date"),
  store.t("vehicle"),
  store.t("driver"),
  store.t("type"),
  store.t("result"),
  store.t("reviewStatus"),
  store.t("issues"),
  store.t("photos"),
  store.t("fraudFlagged"),
  store.t("actions"),
]);

const filtered = computed(() =>
  reports.value.filter((report) => {
    const query = search.value.trim().toLowerCase();
    const matchVehicle =
      !vehicleFilterId.value || report.vehicleId === vehicleFilterId.value;
    const matchDriver =
      !driverFilterId.value || report.driverId === driverFilterId.value;
    const matchType =
      filterType.value === "all" || report.type === filterType.value;
    const normalized = normalizedResult(report);
    const matchResult =
      filterResult.value === "all" ||
      normalized === filterResult.value ||
      (filterResult.value === "needs-review" &&
        report.reviewStatus === "needs-review") ||
      (filterResult.value === "fraud-flagged" && report.fraudSuspicious);
    const time = new Date(report.createdAt).getTime();
    const afterStart =
      !startDate.value ||
      time >= new Date(`${startDate.value}T00:00:00`).getTime();
    const beforeEnd =
      !endDate.value || time <= new Date(`${endDate.value}T23:59:59`).getTime();
    const searchableText = [
      report.vehicle,
      report.driver,
      typeLabel(report.type),
      resultLabel(report),
      reviewLabel(report.reviewStatus),
      report.status,
      report.date,
    ]
      .join(" ")
      .toLowerCase();
    const matchSearch = !query || searchableText.includes(query);

    return (
      matchVehicle &&
      matchDriver &&
      matchSearch &&
      matchType &&
      matchResult &&
      afterStart &&
      beforeEnd
    );
  }),
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
);
const paginatedReports = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});
watch([search, filterType, filterResult, startDate, endDate, pageSize], () => {
  page.value = 1;
});

function setPageSize(size: number) {
  pageSize.value = size;
  page.value = 1;
}

// --- МАСОВЕ ВИДАЛЕННЯ ТА ЧЕКБОКСИ ---
// Унікальні водії для фільтра
const uniqueDrivers = computed(() => {
  const map = new Map<string, { id: string; name: string }>();
  reports.value.forEach(r => {
    if (r.driverId && r.driver) {
      map.set(r.driverId, { id: r.driverId, name: r.driver });
    }
  });
  return Array.from(map.values());
});

const selectedReportIds = ref<string[]>([]);
const allSelected = computed(() =>
  paginatedReports.value.length > 0 && paginatedReports.value.every(r => selectedReportIds.value.includes(r.id))
);
function toggleSelectAll() {
  if (allSelected.value) {
    selectedReportIds.value = [];
  } else {
    selectedReportIds.value = paginatedReports.value.map(r => r.id);
  }
}
function toggleSelectReport(id: string) {
  const idx = selectedReportIds.value.indexOf(id);
  if (idx === -1) {
    selectedReportIds.value.push(id);
  } else {
    selectedReportIds.value.splice(idx, 1);
  }
}
function clearSelectedReports() {
  selectedReportIds.value = [];
}

// --- МАСОВЕ ВИДАЛЕННЯ ---
const showBulkDeleteModal = ref(false);
const bulkDeleteStart = ref("");
const bulkDeleteEnd = ref("");
const bulkDeleteDriver = ref("");
const bulkDeleteType = ref("");
const bulkDeleteFraud = ref(false);
const bulkDeleteEmail = ref("");
const bulkDeletePassword = ref("");
const bulkDeleteError = ref("");
const bulkDeleteLoading = ref(false);

const bulkDeleteFilteredIds = computed(() => {
  const startTs = bulkDeleteStart.value
    ? new Date(`${bulkDeleteStart.value}T00:00:00`).getTime()
    : null;
  const endTs = bulkDeleteEnd.value
    ? new Date(`${bulkDeleteEnd.value}T23:59:59`).getTime()
    : null;

  return reports.value
    .filter((report) => {
      const createdTs = new Date(report.createdAt).getTime();
      if (startTs != null && createdTs < startTs) return false;
      if (endTs != null && createdTs > endTs) return false;
      if (bulkDeleteDriver.value && report.driverId !== bulkDeleteDriver.value) return false;
      if (bulkDeleteType.value && report.type !== bulkDeleteType.value) return false;
      if (bulkDeleteFraud.value && !report.fraudSuspicious) return false;
      return true;
    })
    .map((report) => report.id);
});

const effectiveBulkDeleteIds = computed(() =>
  selectedReportIds.value.length > 0
    ? selectedReportIds.value
    : bulkDeleteFilteredIds.value
);

const bulkDeleteCount = computed(() => effectiveBulkDeleteIds.value.length);

async function handleBulkDelete() {
  bulkDeleteError.value = "";
  if (!bulkDeleteEmail.value || !bulkDeletePassword.value) {
    bulkDeleteError.value = "Email і пароль обов'язкові.";
    return;
  }
  if (!effectiveBulkDeleteIds.value.length) {
    bulkDeleteError.value = "Немає звітів для видалення за вибраними умовами.";
    return;
  }

  bulkDeleteLoading.value = true;

  try {
    const response = await fetch("/api/admin/delete-inspections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionIds: effectiveBulkDeleteIds.value,
        adminEmail: bulkDeleteEmail.value,
        adminPassword: bulkDeletePassword.value,
      }),
    });

    const payload = await response.json().catch(() => ({} as any));

    if (!response.ok) {
      if (response.status === 502 || response.status === 503) {
        bulkDeleteError.value = "Сервер видалення недоступний (502/503). Перезапустіть backend (npm run dev:backend).";
      } else {
        bulkDeleteError.value = payload?.error || `Помилка видалення (HTTP ${response.status}).`;
      }
      return;
    }

    showBulkDeleteModal.value = false;
    clearSelectedReports();
    bulkDeleteEmail.value = "";
    bulkDeletePassword.value = "";
    bulkDeleteError.value = "";
    await fetchReports();
  } catch (e: any) {
    bulkDeleteError.value = e?.message || "Помилка видалення.";
  } finally {
    bulkDeleteLoading.value = false;
  }
}
</script>

<style scoped>
.badge-yellow {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
.badge-orange {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400;
}
</style>
