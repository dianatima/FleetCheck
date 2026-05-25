<template>
  <AppLayout title="Drivers">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <button
        v-for="stat in driverStats"
        :key="stat.status"
        type="button"
        class="card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        :class="
          driverStore.statusFilter === stat.status
            ? 'ring-2 ring-blue-500/40'
            : ''
        "
        @click="driverStore.setStatusFilter(stat.status)"
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
          <option value="new">New</option>
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
                  <p
                    v-if="invitationMessage(d)"
                    class="text-xs text-gray-400 mt-1 whitespace-nowrap"
                  >
                    {{ invitationMessage(d) }}
                  </p>
                </td>

                <td class="px-4 py-3" @click.stop>
                  <div class="flex items-center gap-1">
                    <button
                      v-if="canInviteDriver(d)"
                      @click="sendInvitation(d)"
                      class="btn-secondary gap-1.5 px-2 py-1.5 text-xs whitespace-nowrap"
                      :disabled="invitingDriverId === d.id"
                    >
                      <MailPlus :size="14" />
                      {{ inviteLabel(d) }}
                    </button>

                    <button
                      v-if="canActivateDriver(d)"
                      @click="activateDriver(d)"
                      class="btn-primary px-2 py-1.5 text-xs whitespace-nowrap"
                      :disabled="statusUpdatingDriverId === d.id"
                    >
                      Activate
                    </button>

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

        <BaseTablePagination
          :total="driverStore.total"
          :current-page="driverStore.page"
          :page-size="driverStore.pageSize"
          @update:current-page="driverStore.setPage"
          @update:page-size="driverStore.setPageSize"
        />
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
  MailPlus,
} from "lucide-vue-next";
import AppLayout from "../components/layout/AppLayout.vue";
import BaseTablePagination from "@/components/shared/BaseTablePagination.vue";
import DriverFormModal from "@/components/drivers/DriverFormModal.vue";
import { useAppStore } from "../stores/app";
import { useDriverStore } from "@/stores/driverStore";
import { useAuthStore } from "@/stores/authStore";
import { formatDateOnly } from "@/lib/dateFormat";

type Driver = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  license_no?: string | null;
  license_class?: string | null;
  license_expiry?: string | null;
  med_card_expiry?: string | null;
  status: "new" | "active" | "pending" | "inactive";
  avatar_color?: string | null;
  user_id?: string | null;
  invitation_sent_at?: string | null;
  invitation_accepted_at?: string | null;
};

const store = useAppStore();
const driverStore = useDriverStore();
const authStore = useAuthStore();
const router = useRouter();

const showModal = ref(false);
const editingDriver = ref<Driver | null>(null);
const invitingDriverId = ref<string | null>(null);
const statusUpdatingDriverId = ref<string | null>(null);
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

const driverStats = computed(() => [
  {
    status: "new",
    label: "New",
    count: driverStore.statusCounts.new || 0,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    status: "pending",
    label: store.t("statusPending"),
    count: driverStore.statusCounts.pending || 0,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    status: "active",
    label: store.t("statusActive"),
    count: driverStore.statusCounts.active || 0,
    color: "text-green-600 dark:text-green-400",
  },
  {
    status: "inactive",
    label: store.t("statusInactive"),
    count: driverStore.statusCounts.inactive || 0,
    color: "text-gray-700 dark:text-gray-300",
  },
]);

const statusConfig = computed(() => ({
  new: { label: "New", badge: "badge-blue" },
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
  return formatDateOnly(d, store.language);
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

function canInviteDriver(driver: Driver) {
  return (
    driver.status === "new" ||
    (driver.status === "pending" && !driver.invitation_accepted_at)
  );
}

function inviteLabel(driver: Driver) {
  return driver.status === "new" ? "Send Invitation" : "Resend Invitation";
}

function canActivateDriver(driver: Driver) {
  return driver.status === "pending" && !!driver.invitation_accepted_at;
}

function invitationMessage(driver: Driver) {
  if (driver.status !== "pending") return "";
  if (driver.invitation_accepted_at) return "Invitation accepted";
  if (driver.invitation_sent_at) return "Invitation sent";
  return "";
}

async function sendInvitation(driver: Driver) {
  invitingDriverId.value = driver.id;

  try {
    await driverStore.sendDriverInvitation(driver.id);
  } finally {
    invitingDriverId.value = null;
  }
}

async function activateDriver(driver: Driver) {
  statusUpdatingDriverId.value = driver.id;

  try {
    await driverStore.updateDriverStatus(driver.id, "active");
  } finally {
    statusUpdatingDriverId.value = null;
  }
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
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.badge-yellow {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
</style>
