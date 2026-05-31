<template>
  <AppLayout title="Vehicle Details">
    <RouterLink
      to="/vehicles"
      class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
    >
      <ArrowLeft :size="16" /> {{ store.t("backToFleet") }}
    </RouterLink>

    <div v-if="vehicleStore.loading" class="card p-6 text-sm text-gray-500">
      Loading vehicle...
    </div>

    <div v-else-if="vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ vehicleStore.error }}
    </div>

    <div v-else-if="!vehicle" class="card p-6 text-sm text-gray-500">
      Vehicle not found.
    </div>

    <template v-else>
      <div class="card overflow-hidden mb-5">
        <div
          class="h-48 sm:h-64 bg-gray-100 dark:bg-gray-700 relative overflow-hidden"
          :class="vehicle.photo_url ? 'cursor-pointer group' : ''"
          @click="openPhotoLightbox(vehicle.photo_url ? [vehicle.photo_url] : [], 0)"
        >
          <img
            v-if="vehicle.photo_url"
            :src="vehicle.photo_url"
            :alt="vehicleName"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500"
          >
            <Camera :size="48" />
          </div>

          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          />

          <div
            class="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4"
          >
            <div>
              <h2 class="text-xl font-bold text-white">{{ vehicleName }}</h2>
              <p class="text-white/80 text-sm">
                Unit {{ vehicle.unit }} · {{ vehicle.year }}
              </p>
            </div>

            <span :class="statusConfig[vehicle.status]?.badge || 'badge-gray'">
              {{ statusConfig[vehicle.status]?.label || vehicle.status }}
            </span>
          </div>
        </div>

        <div
          class="p-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700"
        >
          <button
            @click="showEditModal = true"
            class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center"
          >
            <Edit :size="15" /> {{ store.t("editVehicle") }}
          </button>

          <RouterLink
            :to="reportsPath"
            class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center inline-flex"
          >
            <FileText :size="15" /> {{ store.t("reports") }}
          </RouterLink>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(item, i) in details"
            :key="item.label"
            class="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-700"
            :class="i % 3 !== 2 ? 'lg:border-r' : ''"
          >
            <div
              class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <component
                :is="item.icon"
                :size="15"
                class="text-gray-500 dark:text-gray-400"
              />
            </div>

            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ item.label }}
              </p>
              <p
                class="text-sm font-semibold"
                :class="
                  item.muted
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-900 dark:text-white'
                "
              >
                {{ item.value }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-5">
        <div class="card">
          <div
            class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
          >
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
              {{ store.t("inspectionHistory") }}
            </h3>
            <RouterLink
              :to="reportsPath"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              {{ store.t("viewAll") }} <ChevronRight :size="12" />
            </RouterLink>
          </div>

          <div v-if="historyLoading" class="p-4 text-sm text-gray-500">
            Loading inspections...
          </div>
          <div v-else class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <div
              v-for="h in inspectionHistory"
              :key="h.id"
              class="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
              @click="openInspectionModal(h.id)"
            >
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="h.result === 'pass' ? 'bg-green-500' : h.result === 'draft' ? 'bg-yellow-500' : 'bg-red-500'"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ h.type }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ h.date }} · {{ h.driver }}
                </p>
              </div>
              <span v-if="h.issues > 0" class="badge-red"
                >{{ h.issues }} issues</span
              >
              <span :class="historyResultBadge(h.result)">
                {{ historyResultLabel(h.result) }}
              </span>
            </div>
            <div
              v-if="inspectionHistory.length === 0"
              class="p-4 text-sm text-gray-500 dark:text-gray-400"
            >
              No inspections yet.
            </div>
          </div>
        </div>

        <div class="card">
          <div
            class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
          >
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
              {{ store.t("repairHistory") }}
            </h3>
            <RouterLink
              :to="repairsPath"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              {{ store.t("viewAll") }} <ChevronRight :size="12" />
            </RouterLink>
          </div>

          <div v-if="historyLoading" class="p-4 text-sm text-gray-500">
            Loading repairs...
          </div>
          <div v-else class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <div
              v-for="r in repairHistory"
              :key="r.id"
              class="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
              @click="router.push(`/repairs/${r.id}`)"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ r.issue }}
                </p>
                <p class="text-xs text-gray-400">{{ r.date }}</p>
              </div>
              <span
                :class="
                  r.priority === 'high'
                    ? 'badge-red'
                    : r.priority === 'medium'
                    ? 'badge-orange'
                    : 'badge-gray'
                "
              >
                {{ r.priority }}
              </span>
              <span :class="repairStatusBadge(r.status)">{{ repairStatusLabel(r.status) }}</span>
            </div>
            <div
              v-if="repairHistory.length === 0"
              class="p-4 text-sm text-gray-500 dark:text-gray-400"
            >
              No repair history yet.
            </div>
          </div>
        </div>
      </div>
    </template>

    <VehicleFormModal
      v-model="showEditModal"
      :vehicle="vehicle"
      :loading="vehicleStore.loading"
      @save="handleSave"
    />

    <InspectionReportModal
      v-model="inspectionModalOpen"
      :inspection-id="selectedInspectionId"
    />

    <PhotoLightbox
      v-model="photoLightboxOpen"
      :photos="lightboxPhotos"
      :start-index="lightboxStartIndex"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  CreditCard as Edit,
  FileText,
  Camera,
  Fuel,
  Gauge,
  Calendar,
  Hash,
  ChevronRight,
  MapPin,
  User,
} from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import VehicleFormModal from "@/components/vehicles/VehicleFormModal.vue";
import InspectionReportModal from "@/components/shared/InspectionReportModal.vue";
import PhotoLightbox from "@/components/shared/PhotoLightbox.vue";
import { useAppStore } from "../stores/app";
import { useVehicleStore } from "@/stores/vehicleStore";
import { useAuthStore } from "@/stores/authStore";
import { formatDateTime } from "@/lib/dateFormat";
import { supabase } from "@/lib/supabase";

type VehicleStatus = "active" | "needs-attention" | "blocked" | "in-repair";

type Vehicle = {
  id: string;
  unit: string;
  make: string;
  model: string;
  vehicle_type_id: string;
  vehicle_types?: { id: string; name: string } | null;
  year: number;
  plate: string;
  vin?: string | null;
  odometer?: number | null;
  engine_hours?: number | null;
  status: VehicleStatus;
  photo_url?: string | null;
  active_assignment?: any | null;
};

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();

const showEditModal = ref(false);
const historyLoading = ref(false);
const inspectionHistory = ref<any[]>([]);
const repairHistory = ref<any[]>([]);
const photoLightboxOpen = ref(false);
const lightboxPhotos = ref<string[]>([]);
const lightboxStartIndex = ref(0);
const inspectionModalOpen = ref(false);
const selectedInspectionId = ref<string | null>(null);
const vehicleId = computed(() => route.params.id as string);
const vehicle = computed<Vehicle | null>(
  () => vehicleStore.selectedVehicle as Vehicle | null
);

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) {
      await vehicleStore.fetchVehicleById(vehicleId.value);
      await fetchVehicleHistory();
    }
  },
  { immediate: true }
);

watch(vehicleId, async () => {
  if (!authStore.companyId) return;
  await vehicleStore.fetchVehicleById(vehicleId.value);
  await fetchVehicleHistory();
});

const statusConfig = computed(() => ({
  active: { label: store.t("statusActive"), badge: "badge-green" },
  "needs-attention": {
    label: store.t("statusNeedsAttention"),
    badge: "badge-orange",
  },
  blocked: { label: store.t("statusBlocked"), badge: "badge-red" },
  "in-repair": { label: store.t("statusInRepair"), badge: "badge-gray" },
}));

const vehicleName = computed(() => {
  if (!vehicle.value) return "";
  return `${vehicle.value.make || ""} ${vehicle.value.model || ""}`.trim();
});

const reportsPath = computed(() => `/reports?vehicle_id=${vehicleId.value}`);
const repairsPath = computed(() => `/repairs?vehicle_id=${vehicleId.value}`);

const details = computed(() => {
  if (!vehicle.value) return [];

  return [
    { icon: Hash, label: store.t("vin"), value: vehicle.value.vin || "—" },
    {
      icon: MapPin,
      label: store.t("plateNumber"),
      value: vehicle.value.plate || "—",
    },
    {
      icon: Calendar,
      label: store.t("year"),
      value: String(vehicle.value.year || "—"),
    },
    {
      icon: Gauge,
      label: store.t("odometer"),
      value:
        vehicle.value.odometer != null
          ? `${Number(vehicle.value.odometer).toLocaleString()} ${vehicle.value.odometer_unit || 'mi'}`
          : "—",
    },
    {
      icon: Fuel,
      label: store.t("engineHours"),
      value:
        vehicle.value.engine_hours != null
          ? `${Number(vehicle.value.engine_hours).toLocaleString()} hrs`
          : "—",
    },
    {
      icon: Hash,
      label: store.t("type"),
      value: vehicle.value.vehicle_types?.name || "—",
    },
    {
      icon: User,
      label: "Assigned To",
      value: assignedToLabel(vehicle.value),
      muted: !vehicle.value.active_assignment,
    },
    {
      icon: Calendar,
      label: "Assignment Start",
      value: assignmentStartLabel(vehicle.value),
    },
    {
      icon: Hash,
      label: "Assignment Status",
      value: vehicle.value.active_assignment?.status || "Unassigned",
      muted: !vehicle.value.active_assignment,
    },
  ];
});

function assignedToLabel(value: Vehicle) {
  const assignment = value.active_assignment;
  if (!assignment) return "Unassigned";
  const driver = Array.isArray(assignment.drivers) ? assignment.drivers[0] : assignment.drivers;
  return driver?.name || "Assigned";
}

function assignmentStartLabel(value: Vehicle) {
  const startedAt = value.active_assignment?.start_at;
  return startedAt ? formatDateTime(startedAt, store.language) : "—";
}

function openPhotoLightbox(photos: string[] | null | undefined, index = 0) {
  const cleanPhotos = (photos || []).filter(Boolean);
  if (!cleanPhotos.length) return;
  lightboxPhotos.value = cleanPhotos;
  lightboxStartIndex.value = index;
  photoLightboxOpen.value = true;
}

async function openInspectionModal(inspectionId: string) {
  selectedInspectionId.value = inspectionId;
  inspectionModalOpen.value = true;
}

async function handleSave(payload: any) {
  if (!vehicle.value) return;

  await vehicleStore.updateVehicle(vehicle.value.id, payload);
  await vehicleStore.fetchVehicleById(vehicle.value.id);

  showEditModal.value = false;
}

async function fetchVehicleHistory() {
  if (!authStore.companyId || !vehicleId.value) return;

  historyLoading.value = true;

  const [inspectionsResult, repairsResult] = await Promise.all([
    supabase
      .from("inspections")
      .select(
        `
        id,
        type,
        status,
        created_at,
        submitted_at,
        drivers!inspections_driver_id_fkey (
          id,
          name
        ),
        inspection_results (
          id,
          result,
          photo_urls
        ),
        issues (
          id,
          status
        )
      `,
      )
      .eq("company_id", authStore.companyId)
      .eq("vehicle_id", vehicleId.value)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("repairs")
      .select(
        `
        id,
        issue_id,
        title,
        description,
        status,
        created_at,
        issues (
          title,
          severity
        )
      `,
      )
      .eq("company_id", authStore.companyId)
      .eq("vehicle_id", vehicleId.value)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!inspectionsResult.error) {
    inspectionHistory.value = (inspectionsResult.data || []).map(toInspectionHistory);
  }

  if (!repairsResult.error) {
    repairHistory.value = (repairsResult.data || []).map(toRepairHistory);
  }

  historyLoading.value = false;
}

function toInspectionHistory(inspection: any) {
  const results = relationArray(inspection.inspection_results);
  const issues = relationArray(inspection.issues);
  const failed = results.some((result: any) => result.result === "fail");
  const result =
    inspection.status === "draft" ? "draft" : failed ? "fail" : "pass";
  const driver = relation(inspection.drivers);

  return {
    id: inspection.id,
    type: inspection.type === "post-trip" ? store.t("postTrip") : store.t("preTrip"),
    date: formatDateTime(inspection.submitted_at || inspection.created_at, store.language),
    driver: driver?.name || "—",
    result,
    issues: issues.length,
  };
}

function toRepairHistory(repair: any) {
  const issue = relation(repair.issues);

  return {
    id: repair.id,
    issue: repair.title || issue?.title || "Repair",
    date: formatDateTime(repair.created_at, store.language),
    priority: issue?.severity || "medium",
    status: repair.status || "open",
  };
}

function relation(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

function relationArray(value: any) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function historyResultBadge(result: string) {
  if (result === "draft") return "badge-yellow";
  return result === "pass" ? "badge-green" : "badge-red";
}

function historyResultLabel(result: string) {
  if (result === "draft") return store.t("statusDraft");
  return result === "pass" ? store.t("pass") : store.t("fail");
}

function repairStatusLabel(status: string) {
  return {
    open: "Open",
    "in-progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  }[status] || status || "—";
}

function repairStatusBadge(status: string) {
  return {
    open: "badge-red",
    "in-progress": "badge-orange",
    completed: "badge-green",
    cancelled: "badge-gray",
  }[status] || "badge-gray";
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
