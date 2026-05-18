<template>
  <AppLayout title="Drivers">
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="localSearch"
          class="input-field pl-9 py-2 text-sm"
          :placeholder="store.t('searchDrivers')"
        />
      </div>

      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select
          v-model="driverStore.statusFilter"
          @change="driverStore.setStatusFilter(driverStore.statusFilter)"
          class="input-field py-2 text-sm w-auto"
        >
          <option value="all">{{ store.t("allStatus") }}</option>
          <option value="active">{{ store.t("statusActive") }}</option>
          <option value="pending">{{ store.t("statusPending") }}</option>
          <option value="inactive">{{ store.t("statusInactive") }}</option>
        </select>
      </div>

      <button @click="openAddModal" class="btn-primary gap-2 text-sm">
        <Plus :size="16" /> {{ store.t("addDriver") }}
      </button>
    </div>

    <div v-if="driverStore.loading" class="card p-6 text-sm text-gray-500">
      Loading drivers...
    </div>

    <div v-else-if="driverStore.error" class="card p-6 text-sm text-red-500">
      {{ driverStore.error }}
    </div>

    <template v-else>
      <div class="flex flex-wrap gap-2 mb-5">
        <span class="badge-green">
          {{ drivers.filter((d) => d.status === "active").length }}
          {{ store.t("statusActive") }}
        </span>
        <span class="badge-yellow">
          {{ drivers.filter((d) => d.status === "pending").length }}
          {{ store.t("statusPending") }}
        </span>
        <span class="badge-gray">
          {{ drivers.filter((d) => d.status === "inactive").length }}
          {{ store.t("statusInactive") }}
        </span>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr
                class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              >
                <th
                  v-for="h in driverHeaders"
                  :key="h"
                  class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-4 py-3 whitespace-nowrap"
                >
                  {{ h }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="drivers.length === 0">
                <td
                  :colspan="driverHeaders.length"
                  class="text-center py-12 text-sm text-gray-400"
                >
                  {{ store.t("noDriversFound") }}
                </td>
              </tr>

              <tr
                v-for="d in drivers"
                :key="d.id"
                class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                @click="router.push(`/drivers/${d.id}`)"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      :style="{ background: d.avatar_color || '#3b82f6' }"
                    >
                      {{ initials(d.name) }}
                    </div>
                    <div>
                      <p
                        class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap"
                      >
                        {{ d.name }}
                      </p>
                      <p class="text-xs text-gray-400">{{ d.email }}</p>
                    </div>
                  </div>
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap"
                >
                  {{ d.phone || "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap"
                >
                  {{ d.license_no || "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap"
                >
                  {{ d.license_class || "—" }}
                </td>

                <td
                  class="px-4 py-3 text-sm whitespace-nowrap font-medium"
                  :class="
                    isExpired(d.license_expiry)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  <div class="flex items-center gap-1">
                    <AlertCircle
                      v-if="isExpired(d.license_expiry)"
                      :size="13"
                    />
                    {{ d.license_expiry ? formatDate(d.license_expiry) : "—" }}
                  </div>
                </td>

                <td
                  class="px-4 py-3 text-sm whitespace-nowrap font-medium"
                  :class="
                    isExpired(d.med_card_expiry)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                >
                  <div class="flex items-center gap-1">
                    <AlertCircle
                      v-if="isExpired(d.med_card_expiry)"
                      :size="13"
                    />
                    {{
                      d.med_card_expiry ? formatDate(d.med_card_expiry) : "—"
                    }}
                  </div>
                </td>

                <td class="px-4 py-3">
                  <span :class="statusConfig[d.status]?.badge || 'badge-gray'">
                    {{ statusConfig[d.status]?.label || d.status }}
                  </span>
                </td>

                <td class="px-4 py-3" @click.stop>
                  <div class="flex items-center gap-1">
                    <button
                      @click="startEdit(d)"
                      class="icon-btn hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <Pencil :size="14" />
                    </button>

                    <button
                      @click="confirmDelete(d)"
                      class="icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900"
        >
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Showing
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{
                driverStore.total === 0
                  ? 0
                  : (driverStore.page - 1) * driverStore.pageSize + 1
              }}
            </span>
            –
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{
                Math.min(
                  driverStore.page * driverStore.pageSize,
                  driverStore.total
                )
              }}
            </span>
            of
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{ driverStore.total }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <select
              :value="driverStore.pageSize"
              @change="
                driverStore.setPageSize(
                  Number(($event.target as HTMLSelectElement).value)
                )
              "
              class="input-field py-1.5 text-xs w-auto"
            >
              <option :value="5">5 / page</option>
              <option :value="10">10 / page</option>
              <option :value="25">25 / page</option>
              <option :value="50">50 / page</option>
            </select>

            <button
              class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              :disabled="driverStore.page <= 1"
              @click="driverStore.prevPage()"
            >
              Previous
            </button>

            <div
              class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200"
            >
              {{ driverStore.page }} / {{ driverStore.totalPages }}
            </div>

            <button
              class="btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
              :disabled="driverStore.page >= driverStore.totalPages"
              @click="driverStore.nextPage()"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>

    <DriverFormModal
      v-model="showModal"
      :driver="editingDriver"
      :loading="driverStore.loading"
      @save="handleSave"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-vue-next";
import AppLayout from "../components/layout/AppLayout.vue";
import DriverFormModal from "@/components/drivers/DriverFormModal.vue";
import { useAppStore } from "../stores/app";
import { useDriverStore } from "@/stores/driverStore";
import { useAuthStore } from "@/stores/authStore";

type Driver = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  license_no?: string | null;
  license_class?: string | null;
  license_expiry?: string | null;
  med_card_expiry?: string | null;
  status: "active" | "pending" | "inactive";
  avatar_color?: string | null;
};

const store = useAppStore();
const driverStore = useDriverStore();
const authStore = useAuthStore();
const router = useRouter();

const showModal = ref(false);
const editingDriver = ref<Driver | null>(null);
const localSearch = ref(driverStore.search);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(localSearch, (value) => {
  if (searchTimer) clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    driverStore.setSearch(value);
  }, 350);
});

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await driverStore.fetchDrivers();
  },
  { immediate: true }
);

const drivers = computed<Driver[]>(() => driverStore.drivers as Driver[]);

const statusConfig = computed(() => ({
  active: { label: store.t("statusActive"), badge: "badge-green" },
  pending: { label: store.t("statusPending"), badge: "badge-yellow" },
  inactive: { label: store.t("statusInactive"), badge: "badge-gray" },
}));

const driverHeaders = computed(() => [
  store.t("driver"),
  store.t("phone"),
  store.t("licenseHash"),
  store.t("licenseClass"),
  store.t("licExpiry"),
  store.t("medExpiry"),
  store.t("status"),
  "",
]);

const TODAY = new Date().toISOString().split("T")[0];

function isExpired(date?: string | null) {
  return !!date && date < TODAY;
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function openAddModal() {
  editingDriver.value = null;
  showModal.value = true;
}

function startEdit(driver: Driver) {
  editingDriver.value = driver;
  showModal.value = true;
}

async function confirmDelete(driver: Driver) {
  if (confirm(`Delete driver "${driver.name}"?`)) {
    await driverStore.deleteDriver(driver.id);
  }
}

function getRandomAvatarColor() {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function handleSave(payload: any) {
  if (editingDriver.value) {
    await driverStore.updateDriver(editingDriver.value.id, payload);
  } else {
    await driverStore.createDriver({
      ...payload,
      user_id: null,
      avatar_color: getRandomAvatarColor(),
    });
  }

  showModal.value = false;
  editingDriver.value = null;
}
</script>

<style scoped>
.icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors;
}

.badge-yellow {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
</style>
