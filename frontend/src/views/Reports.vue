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
      <div class="relative flex-1 min-w-[220px]">
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
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Filter :size="14" class="text-gray-400 flex-shrink-0" />
        <select
          v-model="filterResult"
          class="input-field py-1.5 text-sm w-40"
          aria-label="Report status"
        >
          <option value="all">{{ store.t("allResults") }}</option>
          <option value="pass">{{ store.t("statusPassed") }}</option>
          <option value="fail">{{ store.t("statusFailed") }}</option>
          <option value="draft">{{ store.t("statusDraft") }}</option>
          <option value="needs-review">
            {{ store.t("statusNeedsReview") }}
          </option>
        </select>
        <select
          v-model="filterType"
          class="input-field py-1.5 text-sm w-36"
          aria-label="Inspection type"
        >
          <option value="all">{{ store.t("allTypes") }}</option>
          <option value="pre-trip">{{ store.t("preTrip") }}</option>
          <option value="post-trip">{{ store.t("postTrip") }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <span class="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Date range:
        </span>
        <BaseDateInput
          v-model="startDate"
          input-class="py-1.5 text-sm w-36"
        />
        <span class="text-gray-400 text-sm">-</span>
        <BaseDateInput
          v-model="endDate"
          input-class="py-1.5 text-sm w-36"
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
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr
              class="table-header-row"
            >
              <th
                v-for="h in reportHeaders"
                :key="h"
                class="table-th"
              >
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
              class="border-b border-gray-100/70 dark:border-gray-800/70 hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors cursor-pointer"
              :class="
                r.reviewStatus === 'needs-review'
                  ? 'bg-yellow-50/40 dark:bg-yellow-900/5'
                  : ''
              "
              @click="viewReport(r)"
            >
              <td
                class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                {{ r.date }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <Truck :size="13" class="text-gray-400 flex-shrink-0" />
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
                    v-if="r.result === 'draft'"
                    :size="13"
                    class="text-amber-500"
                  />
                  <CheckCircle
                    v-else-if="r.result === 'pass'"
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
  type: "pre-trip" | "post-trip";
  result: ReportResult;
  reviewStatus: ReviewStatus;
  reviewIssueId: string | null;
  issues: number;
  photos: number;
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
        plate
      ),
      drivers (
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

  reports.value = normalizeInspectionRows(data || []).map(toReport);
  loading.value = false;
}

function toReport(inspection: any): Report {
  const vehicle = firstRelation(inspection.vehicles);
  const driver = firstRelation(inspection.drivers);
  const results = normalizeRelationArray(inspection.inspection_results);
  const issues = normalizeRelationArray(inspection.issues);
  const failed = results.some((row: any) => row.result === "fail");
  const photos = results.reduce(
    (count: number, row: any) => count + (row.photo_urls?.length || 0),
    0,
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
  if (report.result === "draft") return "badge-yellow";
  return report.result === "pass" ? "badge-green" : "badge-red";
}

function resultLabel(report: Report) {
  if (report.result === "draft") return store.t("statusDraft");
  return report.result === "pass" ? store.t("pass") : store.t("fail");
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
  () => reports.value.filter((report) => report.result === "pass").length,
);
const failCount = computed(
  () => reports.value.filter((report) => report.result === "fail").length,
);
const reviewCount = computed(
  () =>
    reports.value.filter((report) => report.reviewStatus === "needs-review")
      .length,
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
    label: "Pass Rate",
    value: reports.value.length
      ? `${Math.round((passCount.value / reports.value.length) * 100)}%`
      : "0%",
    color: "text-blue-600 dark:text-blue-400",
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
    const matchResult =
      filterResult.value === "all" ||
      report.result === filterResult.value ||
      (filterResult.value === "needs-review" &&
        report.reviewStatus === "needs-review");
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
</script>

<style scoped>
.badge-yellow {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
.badge-orange {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400;
}
</style>
