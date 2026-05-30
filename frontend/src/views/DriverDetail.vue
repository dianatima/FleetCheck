<template>
  <AppLayout title="Driver Details">
    <RouterLink
      to="/drivers"
      class="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm font-medium transition-colors"
    >
      <ArrowLeft :size="16" /> {{ store.t("backToDrivers") }}
    </RouterLink>

    <div v-if="driverStore.loading" class="card p-6 text-sm text-gray-500">
      Loading driver...
    </div>

    <div v-else-if="driverStore.error && !driver" class="card p-6 text-sm text-red-500">
      {{ driverStore.error }}
    </div>

    <div v-else-if="!driver" class="card p-6 text-sm text-gray-500">
      Driver not found.
    </div>

    <template v-else>
      <div class="card p-5 mb-5">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md"
            :style="{ background: driver.avatar_color || '#3b82f6' }"
          >
            <img
              v-if="driver.avatar_url"
              :src="driver.avatar_url"
              :alt="`${driver.name} avatar`"
              class="w-full h-full object-cover"
            />
            <span v-else>{{ initials(driver.name) }}</span>
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
            <p
              v-if="pendingInvitationMessage"
              class="text-xs text-gray-500 dark:text-gray-400 mt-2"
            >
              {{ pendingInvitationMessage }}
            </p>
          </div>

          <div class="flex flex-wrap justify-end gap-2 self-start">
            <button
              v-if="canInviteDriver"
              type="button"
              class="btn-secondary gap-2 text-sm"
              :disabled="invitationSending"
              @click="sendInvitation"
            >
              <MailPlus :size="15" />
              {{
                invitationSending
                  ? "Sending..."
                  : driver.invitation_sent_at
                    ? "Resend Invitation"
                    : "Send Invitation"
              }}
            </button>

            <button
              v-if="canActivateDriver"
              type="button"
              class="btn-primary text-sm"
              :disabled="statusUpdating"
              @click="changeStatus('active')"
            >
              Activate
            </button>

            <button
              v-if="canDeactivateDriver"
              type="button"
              class="btn-secondary text-sm"
              :disabled="statusUpdating"
              @click="changeStatus('inactive')"
            >
              Deactivate
            </button>

            <button
              @click="showEditModal = true"
              class="btn-secondary gap-2 text-sm"
            >
              <Pencil :size="15" /> {{ store.t("edit") }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="invitationSuccess"
        class="card p-4 mb-5 text-sm text-green-700 dark:text-green-300 bg-green-50/80 dark:bg-green-900/15 border-green-100 dark:border-green-900/40"
      >
        {{ invitationSuccess }}
      </div>

      <div
        v-if="invitationError"
        class="card p-4 mb-5 text-sm text-red-600 dark:text-red-300 bg-red-50/80 dark:bg-red-900/15 border-red-100 dark:border-red-900/40"
      >
        {{ invitationError }}
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
          <ExpiryRow :date="driver.license_expiry || undefined" />
          <PhotoGallery
            label="Driver License Photos"
            :photos="driver.license_photo_urls || undefined"
          />
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
          <ExpiryRow :date="driver.med_card_expiry || undefined" />
          <PhotoGallery
            label="Medical Card Photos"
            :photos="driver.med_card_photo_urls || undefined"
          />
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
            :to="reportsPath"
            class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          >
            {{ store.t("viewAll") }} <ChevronRight :size="12" />
          </RouterLink>
        </div>

        <div v-if="inspectionsLoading" class="p-4 text-sm text-gray-500">
          Loading inspections...
        </div>
        <div v-else class="divide-y divide-gray-50 dark:divide-gray-700/50">
          <div
            v-for="r in inspections"
            :key="r.id"
            class="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/45 transition-colors"
            @click="router.push(`/reports/${r.id}`)"
          >
            <div
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="r.status === 'pass' ? 'bg-green-500' : r.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'"
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
            <span :class="inspectionResultBadge(r.status)">
              {{ inspectionResultLabel(r.status) }}
            </span>
          </div>
          <div
            v-if="inspections.length === 0"
            class="p-4 text-sm text-gray-500 dark:text-gray-400"
          >
            No inspections submitted yet.
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
import {
  ref,
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
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
  MailPlus,
} from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import DriverFormModal from "@/components/drivers/DriverFormModal.vue";
import PhotoLightbox from "@/components/shared/PhotoLightbox.vue";
import { useAppStore } from "../stores/app";
import { useDriverStore } from "@/stores/driverStore";
import { useAuthStore } from "@/stores/authStore";
import { formatDateOnly, formatDateTime } from "@/lib/dateFormat";
import { supabase } from "@/lib/supabase";

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
  status: "new" | "active" | "pending" | "inactive";
  avatar_color?: string | null;
  avatar_url?: string | null;
  user_id?: string | null;
  invitation_sent_at?: string | null;
  invitation_accepted_at?: string | null;
  license_photo_urls?: string[] | null;
  med_card_photo_urls?: string[] | null;
};

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const driverStore = useDriverStore();
const authStore = useAuthStore();

const showEditModal = ref(false);
const statusUpdating = ref(false);
const invitationSending = ref(false);
const invitationSuccess = ref("");
const invitationError = ref("");
const inspectionsLoading = ref(false);
const inspections = ref<any[]>([]);
const driverId = computed(() => route.params.id as string);
const driver = computed<Driver | null>(
  () => driverStore.selectedDriver as Driver | null
);
const reportsPath = computed(() => `/reports?driver_id=${driverId.value}`);

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) {
      await driverStore.fetchDriverById(driverId.value);
      await fetchDriverInspections();
    }
  },
  { immediate: true }
);

watch(driverId, async () => {
  if (!authStore.companyId) return;
  await driverStore.fetchDriverById(driverId.value);
  await fetchDriverInspections();
});

let pendingRefreshTimer: ReturnType<typeof setInterval> | null = null;

async function refreshPendingDriver() {
  if (
    document.visibilityState !== "visible" ||
    driver.value?.status !== "pending" ||
    driver.value.invitation_accepted_at
  ) {
    return;
  }

  await driverStore.fetchDriverById(driverId.value, true);
}

onMounted(() => {
  pendingRefreshTimer = setInterval(refreshPendingDriver, 5000);
  window.addEventListener("focus", refreshPendingDriver);
});

onUnmounted(() => {
  if (pendingRefreshTimer) clearInterval(pendingRefreshTimer);
  window.removeEventListener("focus", refreshPendingDriver);
});

const statusConfig = computed(() => ({
  new: { label: "New", badge: "badge-blue" },
  active: { label: store.t("statusActive"), badge: "badge-green" },
  pending: { label: store.t("statusPending"), badge: "badge-yellow" },
  inactive: { label: store.t("statusInactive"), badge: "badge-gray" },
}));

type DriverStatus = Exclude<Driver["status"], "new">;

const canInviteDriver = computed(() => {
  return (
    driver.value?.status === "new" ||
    (driver.value?.status === "pending" && !driver.value.invitation_accepted_at)
  );
});

const canActivateDriver = computed(() => {
  return (
    driver.value?.status !== "active" &&
    !!driver.value?.invitation_accepted_at
  );
});

const canDeactivateDriver = computed(() => {
  return ["active", "pending"].includes(driver.value?.status || "");
});

const pendingInvitationMessage = computed(() => {
  if (driver.value?.status !== "pending") return "";

  if (driver.value.invitation_accepted_at) {
    return "Invitation accepted. Review the driver data and activate the driver.";
  }

  if (driver.value.invitation_sent_at) {
    return "Invitation sent. Waiting for the driver to accept it.";
  }

  return "";
});

const TODAY = new Date().toISOString().split("T")[0];

function isExpired(d?: string | null) {
  return !!d && d < TODAY;
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

async function handleSave(payload: any) {
  if (!driver.value) return;

  await driverStore.updateDriver(driver.value.id, payload);
  await driverStore.fetchDriverById(driver.value.id);

  showEditModal.value = false;
}

async function changeStatus(status: DriverStatus) {
  if (!driver.value || driver.value.status === status) return;

  statusUpdating.value = true;

  try {
    await driverStore.updateDriverStatus(driver.value.id, status);
  } finally {
    statusUpdating.value = false;
  }
}

async function sendInvitation() {
  if (!driver.value) return;

  invitationSending.value = true;
  invitationSuccess.value = "";
  invitationError.value = "";

  try {
    const success = await driverStore.sendDriverInvitation(driver.value.id);

    if (success) {
      invitationSuccess.value =
        driverStore.invitationMessage || "Invitation email was sent again.";
    } else {
      invitationError.value =
        driverStore.error || "Invitation could not be sent.";
    }
  } finally {
    invitationSending.value = false;
  }
}

async function fetchDriverInspections() {
  if (!authStore.companyId || !driverId.value) return;

  inspectionsLoading.value = true;

  const { data, error } = await supabase
    .from("inspections")
    .select(
      `
      id,
      type,
      status,
      created_at,
      submitted_at,
      inspection_results (
        id,
        result
      ),
      issues (
        id
      )
    `,
    )
    .eq("company_id", authStore.companyId)
    .eq("driver_id", driverId.value)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!error) {
    inspections.value = (data || []).map(toInspectionRow);
  } else {
    inspections.value = [];
  }

  inspectionsLoading.value = false;
}

function toInspectionRow(inspection: any) {
  const results = relationArray(inspection.inspection_results);
  const failed = results.some((result: any) => result.result === "fail");
  const status =
    inspection.status === "draft" ? "draft" : failed ? "fail" : "pass";

  return {
    id: inspection.id,
    date: formatDateTime(inspection.submitted_at || inspection.created_at, store.language),
    type: inspection.type === "post-trip" ? store.t("postTrip") : store.t("preTrip"),
    status,
    issues: relationArray(inspection.issues).length,
  };
}

function relationArray(value: any) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function inspectionResultBadge(status: string) {
  if (status === "draft") return "badge-yellow";
  return status === "pass" ? "badge-green" : "badge-red";
}

function inspectionResultLabel(status: string) {
  if (status === "draft") return store.t("statusDraft");
  return status === "pass" ? store.t("pass") : store.t("fail");
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

const PhotoGallery = defineComponent({
  props: {
    label: String,
    photos: Array as () => string[] | null | undefined,
  },
  setup(props) {
    const photoLightboxOpen = ref(false);
    const lightboxStartIndex = ref(0);

    function openPhoto(index: number) {
      if (!props.photos?.length) return;
      lightboxStartIndex.value = index;
      photoLightboxOpen.value = true;
    }

    return () =>
      h("div", { class: "pt-1" }, [
        h(
          "p",
          { class: "text-xs text-gray-500 dark:text-gray-400 mb-2" },
          props.label
        ),
        props.photos?.length
          ? h(
              "div",
              { class: "grid grid-cols-2 sm:grid-cols-3 gap-2" },
              props.photos.map((photo, index) =>
                h(
                  "button",
                  {
                    key: photo,
                    type: "button",
                    onClick: () => openPhoto(index),
                    class:
                      "block aspect-[4/3] overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:opacity-90",
                  },
                  [
                    h("img", {
                      src: photo,
                      alt: `${props.label || "Document"} ${index + 1}`,
                      class:
                        "w-full h-full object-cover transition-transform hover:scale-105",
                    }),
                  ]
                )
              )
            )
          : h(
              "div",
              {
                class:
                  "rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-4 text-sm text-gray-400 dark:text-gray-500",
              },
              "No photos uploaded."
            ),
        h(PhotoLightbox, {
          modelValue: photoLightboxOpen.value,
          photos: props.photos || [],
          startIndex: lightboxStartIndex.value,
          "onUpdate:modelValue": (value: boolean) => {
            photoLightboxOpen.value = value;
          },
        }),
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

</script>

<style scoped>
.section-heading {
  @apply text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider;
}

.badge-yellow {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400;
}
</style>
