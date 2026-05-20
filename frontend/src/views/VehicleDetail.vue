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
      <div v-if="saveNotice" class="card p-6 mb-5 text-sm text-amber-700 dark:text-amber-300">
        {{ saveNotice }}
      </div>

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

        <!-- Actions -->
        <div
          class="p-4 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700"
        >
          <button
            @click="openEdit"
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

        <!-- Details grid -->
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
        <!-- Inspection History: залишаємо поки mock -->
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
              class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
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

              <span v-if="h.issues > 0" class="badge-red">
                {{ h.issues }} issues
              </span>

              <span :class="h.status === 'pass' ? 'badge-green' : 'badge-red'">
                {{ h.status === "pass" ? store.t("pass") : store.t("fail") }}
              </span>
            </div>
          </div>
        </div>

        <!-- Repair History: залишаємо поки mock -->
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
              class="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
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

    <!-- Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showEditModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          @click.self="closeEditModal"
        >
          <div
            class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10"
            >
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ store.t("editVehicle") }}
              </h2>

              <button
                @click="closeEditModal"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X :size="18" />
              </button>
            </div>

            <form @submit.prevent="saveEdit" class="p-6 space-y-5">
              <div class="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                <p class="font-medium">Only business-specific vehicle fields can be edited.</p>
                <p class="mt-1 text-xs text-amber-600 dark:text-amber-300">
                  You can change the internal unit number, license plate, status, and photo. VIN, make, model, type, year, odometer, and engine hours stay locked to preserve one shared vehicle history across businesses.
                </p>
              </div>

              <!-- Main vehicle photo -->
              <div>
                <label class="label">{{ store.t("vehiclePhoto") }}</label>

                <div
                  class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                  @click="editFileInput?.click()"
                >
                  <input
                    ref="editFileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleEditPhoto"
                  />

                  <template v-if="photoPreview || editForm.photo_url">
                    <img
                      :src="photoPreview || editForm.photo_url"
                      alt="Preview"
                      class="w-full max-h-40 object-cover rounded-lg"
                    />

                    <button
                      type="button"
                      @click.stop="removePhoto"
                      class="text-xs text-red-500 hover:underline"
                    >
                      {{ store.t("removePhoto") }}
                    </button>
                  </template>

                  <template v-else>
                    <div
                      class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"
                    >
                      <Camera :size="22" class="text-blue-500" />
                    </div>

                    <div class="text-center">
                      <p
                        class="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {{ store.t("clickToUpload") }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        {{ store.t("pngJpgUpTo10mb") }}
                      </p>
                    </div>
                  </template>
                </div>
              </div>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    {{ store.t("vehicleNumber") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input v-model="editForm.unit" class="input-field" required />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("type") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select v-model="editForm.type" class="input-field" required disabled>
                    <option v-for="t in vehicleTypes" :key="t" :value="t">
                      {{ t }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="label">
                    {{ store.t("make") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input v-model="editForm.make" class="input-field" required disabled />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("model") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="editForm.model"
                    class="input-field"
                    disabled
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("year") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="editForm.year"
                    class="input-field"
                    type="number"
                    min="1990"
                    :max="new Date().getFullYear() + 1"
                    disabled
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("plateNumber") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="editForm.plate"
                    class="input-field"
                    required
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("vin") }}</label>
                  <input v-model="editForm.vin" class="input-field" disabled />
                </div>

                <div>
                  <label class="label">{{ store.t("odometer") }}</label>
                  <input
                    v-model.number="editForm.odometer"
                    class="input-field"
                    type="number"
                    min="0"
                    disabled
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("engineHours") }}</label>
                  <input
                    v-model.number="editForm.engine_hours"
                    class="input-field"
                    type="number"
                    min="0"
                    step="0.1"
                    disabled
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("status") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="editForm.status"
                    class="input-field"
                    required
                  >
                    <option
                      v-for="s in vehicleStatuses"
                      :key="s.value"
                      :value="s.value"
                    >
                      {{ s.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div
                class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <button
                  type="button"
                  @click="closeEditModal"
                  class="btn-secondary px-5 py-2.5"
                >
                  {{ store.t("cancel") }}
                </button>

                <button type="submit" class="btn-primary px-6 py-2.5 gap-2">
                  <Save :size="16" /> {{ store.t("saveChanges") }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
  X,
  Save,
} from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import { useAppStore } from "../stores/app";
import { useVehicleStore } from "@/stores/vehicleStore";
import { uploadVehiclePhoto } from "@/api/storage";
import { vehicleTypeOptions } from "@/lib/vehicleCatalog";

type VehicleStatus = "active" | "needs-attention" | "blocked" | "in-repair";

type Vehicle = {
  id: string;
  company_id?: string | null;
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
  created_at?: string;
};

const store = useAppStore();
const route = useRoute();
const vehicleStore = useVehicleStore();

const vehicleId = computed(() => route.params.id as string);
const vehicle = computed<Vehicle | null>(
  () => vehicleStore.selectedVehicle as Vehicle | null
);
const saveNotice = ref("");

onMounted(() => {
  vehicleStore.fetchVehicleById(vehicleId.value);
});

const vehicleTypes = vehicleTypeOptions;

const vehicleStatuses = computed(() => [
  { value: "active", label: store.t("statusActive") },
  { value: "needs-attention", label: store.t("statusNeedsAttention") },
  { value: "blocked", label: store.t("statusBlocked") },
  { value: "in-repair", label: store.t("statusInRepair") },
]);

const statusConfig = computed(
  (): Record<string, { label: string; badge: string }> => ({
    active: { label: store.t("statusActive"), badge: "badge-green" },
    "needs-attention": {
      label: store.t("statusNeedsAttention"),
      badge: "badge-orange",
    },
    blocked: { label: store.t("statusBlocked"), badge: "badge-red" },
    "in-repair": { label: store.t("statusInRepair"), badge: "badge-gray" },
  })
);

const vehicleName = computed(() => {
  if (!vehicle.value) return "";
  return `${vehicle.value.make || ""} ${vehicle.value.model || ""}`.trim();
});

const details = computed(() => {
  if (!vehicle.value) return [];

  return [
    {
      icon: Hash,
      label: store.t("vin"),
      value: vehicle.value.vin || "—",
    },
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
    {
      icon: Hash,
      label: store.t("type"),
      value: vehicle.value.type || "—",
    },
  ];
});

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
  {
    date: "May 10, 6:45 PM",
    type: "Post-Trip",
    driver: "John Smith",
    status: "pass",
    issues: 0,
  },
];

const repairHistory = [
  {
    date: "May 8",
    issue: "Left rear tire pressure",
    priority: "medium",
  },
  {
    date: "Apr 28",
    issue: "Windshield wiper replacement",
    priority: "low",
  },
  {
    date: "Apr 10",
    issue: "Brake pad inspection",
    priority: "high",
  },
];

const showEditModal = ref(false);
const editFileInput = ref<HTMLInputElement | null>(null);
const selectedPhotoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);

const editForm = ref({
  unit: "",
  type: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  vin: "",
  odometer: 0 as number | null,
  engine_hours: null as number | null,
  status: "active" as VehicleStatus,
  photo_url: "",
});

function openEdit() {
  if (!vehicle.value) return;

  saveNotice.value = "";

  editForm.value = {
    unit: vehicle.value.unit || "",
    type: vehicle.value.type || "",
    make: vehicle.value.make || "",
    model: vehicle.value.model || "",
    year: vehicle.value.year || new Date().getFullYear(),
    plate: vehicle.value.plate || "",
    vin: vehicle.value.vin || "",
    odometer: vehicle.value.odometer ?? 0,
    engine_hours: vehicle.value.engine_hours ?? null,
    status: vehicle.value.status || "active",
    photo_url: vehicle.value.photo_url || "",
  };

  selectedPhotoFile.value = null;
  photoPreview.value = null;
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  selectedPhotoFile.value = null;
  photoPreview.value = null;
}

function handleEditPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  selectedPhotoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

function removePhoto() {
  selectedPhotoFile.value = null;
  photoPreview.value = null;
  editForm.value.photo_url = "";
}

async function saveEdit() {
  if (!vehicle.value) return;

  saveNotice.value = "";
  let photoUrl = editForm.value.photo_url || null;

  if (selectedPhotoFile.value) {
    try {
      photoUrl = await uploadVehiclePhoto(selectedPhotoFile.value);
    } catch (uploadError: any) {
      saveNotice.value = uploadError?.message || "Vehicle photo could not be uploaded. The vehicle was saved without a photo.";
      photoUrl = editForm.value.photo_url || null;
    }
  }

  const updated = await vehicleStore.updateVehicle(vehicle.value.id, {
    unit: editForm.value.unit,
    plate: editForm.value.plate,
    status: editForm.value.status,
    photo_url: photoUrl,
  });

  if (!updated) {
    return;
  }

  await vehicleStore.fetchVehicleById(vehicle.value.id);

  closeEditModal();
}

async function toggleOutOfService() {
  if (!vehicle.value) return;

  const nextStatus = vehicle.value.status === "blocked" ? "active" : "blocked";

  await vehicleStore.updateVehicle(vehicle.value.id, {
    status: nextStatus,
  });

  await vehicleStore.fetchVehicleById(vehicle.value.id);
}
</script>

<style scoped>
.badge-orange {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400;
}

.btn-danger {
  @apply inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
