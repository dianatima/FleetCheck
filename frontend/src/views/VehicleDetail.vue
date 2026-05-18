<template>
  <AppLayout title="Vehicle Detail">
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
        >
          <img
            v-if="vehicle.photo_url"
            :src="vehicle.photo_url"
            :alt="vehicleName"
            class="w-full h-full object-cover"
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
            to="/reports"
            class="btn-secondary gap-2 text-sm flex-1 sm:flex-none justify-center inline-flex"
          >
            <FileText :size="15" /> {{ store.t("reports") }}
          </RouterLink>

          <button
            @click="toggleOutOfService"
            class="gap-2 text-sm flex-1 sm:flex-none justify-center btn-danger"
          >
            <XCircle :size="15" />
            {{
              vehicle.status === "blocked"
                ? store.t("restoreService")
                : store.t("outOfService")
            }}
          </button>
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
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
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
              to="/reports"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              {{ store.t("viewAll") }} <ChevronRight :size="12" />
            </RouterLink>
          </div>

          <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <div
              v-for="h in inspHistory"
              :key="h.date"
              class="flex items-center gap-3 p-4"
            >
              <div
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="h.status === 'pass' ? 'bg-green-500' : 'bg-red-500'"
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
              <span :class="h.status === 'pass' ? 'badge-green' : 'badge-red'">
                {{ h.status === "pass" ? store.t("pass") : store.t("fail") }}
              </span>
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
              to="/repairs"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              {{ store.t("viewAll") }} <ChevronRight :size="12" />
            </RouterLink>
          </div>

          <div class="divide-y divide-gray-50 dark:divide-gray-700/50">
            <div
              v-for="r in repairHistory"
              :key="r.issue"
              class="flex items-center gap-3 p-4"
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
              <span class="badge-green">{{ store.t("statusCompleted") }}</span>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowLeft,
  CreditCard as Edit,
  FileText,
  XCircle,
  Camera,
  Fuel,
  Gauge,
  Calendar,
  Hash,
  ChevronRight,
  MapPin,
} from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import VehicleFormModal from "@/components/vehicles/VehicleFormModal.vue";
import { useAppStore } from "../stores/app";
import { useVehicleStore } from "@/stores/vehicleStore";
import { useAuthStore } from "@/stores/authStore";

type VehicleStatus = "active" | "needs-attention" | "blocked" | "in-repair";

type Vehicle = {
  id: string;
  unit: string;
  make: string;
  model: string;
  type: string;
  year: number;
  plate: string;
  vin?: string | null;
  odometer?: number | null;
  engine_hours?: number | null;
  status: VehicleStatus;
  photo_url?: string | null;
};

const store = useAppStore();
const route = useRoute();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();

const showEditModal = ref(false);
const vehicleId = computed(() => route.params.id as string);
const vehicle = computed<Vehicle | null>(
  () => vehicleStore.selectedVehicle as Vehicle | null
);

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await vehicleStore.fetchVehicleById(vehicleId.value);
  },
  { immediate: true }
);

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
          ? `${Number(vehicle.value.odometer).toLocaleString()} mi`
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
    { icon: Hash, label: store.t("type"), value: vehicle.value.type || "—" },
  ];
});

async function handleSave(payload: any) {
  if (!vehicle.value) return;

  await vehicleStore.updateVehicle(vehicle.value.id, payload);
  await vehicleStore.fetchVehicleById(vehicle.value.id);

  showEditModal.value = false;
}

async function toggleOutOfService() {
  if (!vehicle.value) return;

  const nextStatus = vehicle.value.status === "blocked" ? "active" : "blocked";

  await vehicleStore.updateVehicle(vehicle.value.id, {
    status: nextStatus,
  });

  await vehicleStore.fetchVehicleById(vehicle.value.id);
}

const inspHistory = [
  {
    date: "Today 7:24 AM",
    type: "Pre-Trip",
    driver: "John Smith",
    status: "pass",
    issues: 0,
  },
  {
    date: "Yesterday 6:15 PM",
    type: "Post-Trip",
    driver: "John Smith",
    status: "pass",
    issues: 0,
  },
  {
    date: "May 11, 7:02 AM",
    type: "Pre-Trip",
    driver: "John Smith",
    status: "fail",
    issues: 2,
  },
];

const repairHistory = [
  { date: "May 8", issue: "Left rear tire pressure", priority: "medium" },
  { date: "Apr 28", issue: "Windshield wiper replacement", priority: "low" },
  { date: "Apr 10", issue: "Brake pad inspection", priority: "high" },
];
</script>

<style scoped>
.badge-orange {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400;
}

.btn-danger {
  @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors;
}
</style>
