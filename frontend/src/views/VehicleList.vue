<template>
  <AppLayout title="Fleet Vehicles">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <button
        v-for="stat in vehicleStats"
        :key="stat.status"
        type="button"
        class="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        :class="
          vehicleStore.statusFilter === stat.status
            ? 'ring-2 ring-blue-500/40'
            : ''
        "
        @click="vehicleStore.setStatusFilter(stat.status)"
      >
        <p class="text-3xl font-bold" :class="stat.color">
          {{ stat.count }}
        </p>
        <p class="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ stat.label }}
        </p>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          :placeholder="store.t('searchVehicles')"
        />
      </div>

      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="vehicleStore.statusFilter"
          @change="vehicleStore.setStatusFilter(vehicleStore.statusFilter)"
          class="input-field py-2 text-sm w-auto"
        >
          <option value="all">{{ store.t("allStatus") }}</option>
          <option value="active">{{ store.t("statusActive") }}</option>
          <option value="needs-attention">
            {{ store.t("statusNeedsAttention") }}
          </option>
          <option value="blocked">{{ store.t("statusBlocked") }}</option>
          <option value="in-repair">{{ store.t("statusInRepair") }}</option>
        </select>
      </div>

      <button @click="openAddModal" class="btn-primary gap-2 text-sm">
        <Plus :size="16" /> {{ store.t("addVehicle") }}
      </button>
    </div>

    <div v-if="vehicleStore.loading" class="card p-6 text-sm text-gray-500">
      Loading vehicles...
    </div>

    <div v-else-if="vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ vehicleStore.error }}
    </div>

    <template v-else>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr
                class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              >
                <th
                  v-for="h in vehicleHeaders"
                  :key="h"
                  class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="v in vehicles"
                :key="v.id"
                class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td
                  class="px-4 py-3 cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        v-if="v.photo_url"
                        :src="v.photo_url"
                        alt=""
                        class="w-full h-full object-cover"
                        @error="hideBrokenImage"
                      />
                    </div>

                    <div>
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap"
                      >
                        {{ getVehicleName(v) }}
                      </p>
                      <p class="text-xs font-mono text-gray-400">
                        {{ v.unit }}
                      </p>
                    </div>
                  </div>
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  {{ getVehicleTypeName(v) }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  {{ v.year ?? "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  {{ v.plate }}
                </td>

                <td
                  class="px-4 py-3 text-xs text-gray-400 font-mono whitespace-nowrap cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  {{ v.vin ? v.vin.substring(0, 12) + "…" : "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  {{
                    v.odometer != null
                      ? Number(v.odometer).toLocaleString() + " mi"
                      : "—"
                  }}
                </td>

                <td
                  class="px-4 py-3 cursor-pointer"
                  @click="router.push(`/vehicles/${v.id}`)"
                >
                  <span :class="statusConfig[v.status]?.badge || 'badge-gray'">
                    {{ statusConfig[v.status]?.label || v.status }}
                  </span>
                </td>

                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button
                      @click.stop="startEdit(v)"
                      class="icon-btn hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <Pencil :size="14" />
                    </button>

                    <button
                      @click.stop="confirmDelete(v)"
                      class="icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="vehicles.length === 0">
                <td
                  :colspan="vehicleHeaders.length"
                  class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No vehicles found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <BaseTablePagination
          :total="vehicleStore.total"
          :current-page="vehicleStore.page"
          :page-size="vehicleStore.pageSize"
          @update:current-page="vehicleStore.setPage"
          @update:page-size="vehicleStore.setPageSize"
        />
      </div>
    </template>

    <VehicleFormModal
      v-model="showModal"
      :vehicle="editingVehicle"
      :loading="vehicleStore.loading"
      @save="handleSave"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Search, Filter, Plus, Pencil, Trash2 } from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import BaseTablePagination from "@/components/shared/BaseTablePagination.vue";
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
  vehicle_type_id: string;
  vehicle_types?: { id: string; name: string } | null;
  year: number;
  plate: string;
  vin?: string | null;
  odometer?: number | null;
  status: VehicleStatus;
  photo_url?: string | null;
};

const store = useAppStore();
const vehicleStore = useVehicleStore();
const authStore = useAuthStore();
const router = useRouter();

const showModal = ref(false);
const editingVehicle = ref<Vehicle | null>(null);
const localSearch = ref(vehicleStore.search);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(localSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => vehicleStore.setSearch(value), 350);
});

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await vehicleStore.fetchVehicles();
  },
  { immediate: true }
);

const vehicles = computed<Vehicle[]>(() => vehicleStore.vehicles as Vehicle[]);

const vehicleStats = computed(() => [
  {
    status: "active",
    label: store.t("statusActive"),
    count: vehicleStore.statusCounts.active || 0,
    color: "text-green-600 dark:text-green-400",
  },
  {
    status: "needs-attention",
    label: store.t("statusNeedsAttention"),
    count: vehicleStore.statusCounts["needs-attention"] || 0,
    color: "text-orange-600 dark:text-orange-400",
  },
  {
    status: "blocked",
    label: store.t("statusBlocked"),
    count: vehicleStore.statusCounts.blocked || 0,
    color: "text-red-600 dark:text-red-400",
  },
  {
    status: "in-repair",
    label: store.t("statusInRepair"),
    count: vehicleStore.statusCounts["in-repair"] || 0,
    color: "text-gray-700 dark:text-gray-300",
  },
]);

const statusConfig = computed(() => ({
  active: { label: store.t("statusActive"), badge: "badge-green" },
  "needs-attention": {
    label: store.t("statusNeedsAttention"),
    badge: "badge-orange",
  },
  blocked: { label: store.t("statusBlocked"), badge: "badge-red" },
  "in-repair": { label: store.t("statusInRepair"), badge: "badge-gray" },
}));

const vehicleHeaders = computed(() => [
  store.t("vehicle"),
  store.t("type"),
  store.t("year"),
  store.t("plate"),
  store.t("vin"),
  store.t("odometer"),
  store.t("status"),
  "",
]);

function getVehicleName(v: Vehicle) {
  return `${v.make || ""} ${v.model || ""}`.trim();
}

function getVehicleTypeName(v: Vehicle) {
  return v.vehicle_types?.name || "—";
}

function hideBrokenImage(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}

function openAddModal() {
  editingVehicle.value = null;
  showModal.value = true;
}

function startEdit(vehicle: Vehicle) {
  editingVehicle.value = vehicle;
  showModal.value = true;
}

async function confirmDelete(v: Vehicle) {
  if (confirm(`Delete "${getVehicleName(v)}" (${v.unit})?`)) {
    await vehicleStore.deleteVehicle(v.id);
  }
}

async function handleSave(payload: any) {
  if (editingVehicle.value) {
    await vehicleStore.updateVehicle(editingVehicle.value.id, payload);
  } else {
    await vehicleStore.createVehicle(payload);
  }

  showModal.value = false;
  editingVehicle.value = null;
}
</script>

<style scoped>
.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors;
}

.badge-orange {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400;
}
</style>
