<template>
  <AppLayout title="Driver Profile">
    <RouterLink
      to="/drivers"
      class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
    >
      <ArrowLeft :size="16" /> {{ store.t("backToDrivers") }}
    </RouterLink>

    <div v-if="driverStore.loading" class="card p-6 text-sm text-gray-500">
      Loading driver...
    </div>

    <div v-else-if="driverStore.error" class="card p-6 text-sm text-red-500">
      {{ driverStore.error }}
    </div>

    <div v-else-if="!driver" class="card p-6 text-sm text-gray-500">
      Driver not found.
    </div>

    <template v-else>
      <div class="card p-5 mb-5">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md"
            :style="{ background: driver.avatar_color || '#3b82f6' }"
          >
            {{ initials(driver.name) }}
          </div>

          <div class="flex-1 min-w-0">
            <h2
              class="text-xl font-bold text-gray-900 dark:text-white leading-tight"
            >
              {{ driver.name }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ driver.license_class || "—" }}
            </p>
            <span
              :class="statusConfig[driver.status]?.badge || 'badge-gray'"
              class="mt-1.5 inline-block"
            >
              {{ statusConfig[driver.status]?.label || driver.status }}
            </span>
          </div>

          <button
            @click="showEditModal = true"
            class="btn-secondary gap-2 text-sm self-start"
          >
            <Pencil :size="15" /> {{ store.t("edit") }}
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-5 mb-5">
        <div class="card p-5 space-y-4">
          <h3 class="section-heading">{{ store.t("personalInformation") }}</h3>
          <DetailRow
            :icon="Mail"
            :label="store.t('emailField')"
            :value="driver.email || '—'"
          />
          <DetailRow
            :icon="Phone"
            :label="store.t('phone')"
            :value="driver.phone || '—'"
          />
          <DetailRow
            :icon="Cake"
            :label="store.t('dateOfBirth')"
            :value="driver.birthday ? formatDate(driver.birthday) : '—'"
          />
          <DetailRow
            :icon="MapPin"
            :label="store.t('address')"
            :value="driver.address || '—'"
          />
          <DetailRow
            :icon="CalendarDays"
            :label="store.t('hireDate')"
            :value="driver.hire_date ? formatDate(driver.hire_date) : '—'"
          />
        </div>

        <div
          class="border border-red-200 dark:border-red-800 rounded-xl p-5 bg-red-50/40 dark:bg-red-900/10 space-y-4"
        >
          <h3
            class="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Heart :size="12" /> {{ store.t("emergencyContact") }}
          </h3>
          <DetailRow
            :icon="User"
            :label="store.t('contactName')"
            :value="driver.emergency_name || '—'"
          />
          <DetailRow
            :icon="Phone"
            :label="store.t('phone')"
            :value="driver.emergency_phone || '—'"
          />
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-5 mb-5">
        <div class="card p-5 space-y-4">
          <h3 class="section-heading flex items-center gap-1.5">
            <FileText :size="12" class="text-blue-500" />
            {{ store.t("driverLicense") }}
          </h3>
          <DetailRow
            :icon="Hash"
            :label="store.t('licenseNumber')"
            :value="driver.license_no || '—'"
            mono
          />
          <DetailRow
            :icon="Award"
            :label="store.t('class')"
            :value="driver.license_class || '—'"
          />
          <ExpiryRow :date="driver.license_expiry" />
        </div>

        <div class="card p-5 space-y-4">
          <h3 class="section-heading flex items-center gap-1.5">
            <FileText :size="12" class="text-green-500" />
            {{ store.t("medicalCard") }}
          </h3>
          <DetailRow
            :icon="Hash"
            :label="store.t('cardNumber')"
            :value="driver.med_card_no || '—'"
            mono
          />
          <ExpiryRow :date="driver.med_card_expiry" />
        </div>
      </div>

      <div class="card mb-5">
        <div
          class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
        >
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
            {{ store.t("recentInspections") }}
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
            v-for="r in inspections"
            :key="r.id"
            class="flex items-center gap-3 p-4"
          >
            <div
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="r.status === 'pass' ? 'bg-green-500' : 'bg-red-500'"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ r.type }}
              </p>
              <p class="text-xs text-gray-400">{{ r.date }}</p>
            </div>
            <span v-if="r.issues > 0" class="badge-red"
              >{{ r.issues }} issues</span
            >
            <span :class="r.status === 'pass' ? 'badge-green' : 'badge-red'">
              {{ r.status === "pass" ? store.t("pass") : store.t("fail") }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <DriverFormModal
      v-model="showEditModal"
      :driver="driver"
      :loading="driverStore.loading"
      @save="handleSave"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h, watch } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowLeft,
  Pencil,
  FileText,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  Hash,
  Award,
  CalendarDays,
  Cake,
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
  birthday?: string | null;
  address?: string | null;
  emergency_name?: string | null;
  emergency_phone?: string | null;
  license_no?: string | null;
  license_class?: string | null;
  license_expiry?: string | null;
  med_card_no?: string | null;
  med_card_expiry?: string | null;
  hire_date?: string | null;
  status: "active" | "pending" | "inactive";
  avatar_color?: string | null;
};

const store = useAppStore();
const route = useRoute();
const driverStore = useDriverStore();
const authStore = useAuthStore();

const showEditModal = ref(false);
const driverId = computed(() => route.params.id as string);
const driver = computed<Driver | null>(
  () => driverStore.selectedDriver as Driver | null
);

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await driverStore.fetchDriverById(driverId.value);
  },
  { immediate: true }
);

const statusConfig = computed(() => ({
  active: { label: store.t("statusActive"), badge: "badge-green" },
  pending: { label: store.t("statusPending"), badge: "badge-yellow" },
  inactive: { label: store.t("statusInactive"), badge: "badge-gray" },
}));

const TODAY = new Date().toISOString().split("T")[0];

function isExpired(d?: string | null) {
  return !!d && d < TODAY;
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

async function handleSave(payload: any) {
  if (!driver.value) return;

  await driverStore.updateDriver(driver.value.id, payload);
  await driverStore.fetchDriverById(driver.value.id);

  showEditModal.value = false;
}

const DetailRow = defineComponent({
  props: {
    icon: Object,
    label: String,
    value: String,
    mono: Boolean,
  },
  setup(props) {
    return () =>
      h("div", { class: "flex items-start gap-3" }, [
        h(
          "div",
          {
            class:
              "w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0",
          },
          [
            h(props.icon as any, {
              size: 15,
              class: "text-gray-500 dark:text-gray-400",
            }),
          ]
        ),
        h("div", [
          h(
            "p",
            { class: "text-xs text-gray-500 dark:text-gray-400" },
            props.label
          ),
          h(
            "p",
            {
              class: `text-sm font-semibold text-gray-900 dark:text-white mt-0.5${
                props.mono ? " font-mono" : ""
              }`,
            },
            props.value
          ),
        ]),
      ]);
  },
});

const ExpiryRow = defineComponent({
  props: {
    date: String,
  },
  setup(props) {
    return () =>
      h("div", { class: "flex items-start gap-3" }, [
        h(
          "div",
          {
            class:
              "w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0",
          },
          [
            h(CalendarDays as any, {
              size: 15,
              class: "text-gray-500 dark:text-gray-400",
            }),
          ]
        ),
        h("div", [
          h(
            "p",
            { class: "text-xs text-gray-500 dark:text-gray-400" },
            store.t("expiryDate")
          ),
          h(
            "p",
            {
              class: `text-sm font-semibold flex items-center gap-1.5 mt-0.5 ${
                isExpired(props.date)
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-white"
              }`,
            },
            [
              isExpired(props.date)
                ? h(AlertCircle as any, { size: 14 })
                : null,
              props.date ? formatDate(props.date) : "—",
              isExpired(props.date)
                ? h("span", { class: "text-xs font-normal" }, "(Expired)")
                : null,
            ]
          ),
        ]),
      ]);
  },
});

const inspections = [
  { id: 1, date: "Today 7:24 AM", type: "Pre-Trip", status: "pass", issues: 0 },
  {
    id: 2,
    date: "Yesterday 6:15 PM",
    type: "Post-Trip",
    status: "pass",
    issues: 0,
  },
  {
    id: 3,
    date: "May 11, 7:02 AM",
    type: "Pre-Trip",
    status: "fail",
    issues: 2,
  },
];
</script>

<style scoped>
.section-heading {
  @apply text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider;
}

.badge-yellow {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
</style>
