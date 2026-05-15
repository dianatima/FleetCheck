<template>
  <AppLayout title="Fleet Vehicles">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="relative flex-1 min-w-48">
        <Search
          :size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="search"
          class="input-field pl-9 py-2 text-sm"
          :placeholder="store.t('searchVehicles')"
        />
      </div>

      <div class="flex items-center gap-2">
        <Filter :size="15" class="text-gray-400" />
        <select v-model="filterStatus" class="input-field py-2 text-sm w-auto">
          <option value="all">{{ store.t("allStatus") }}</option>
          <option value="active">{{ store.t("statusActive") }}</option>
          <option value="needs-attention">
            {{ store.t("statusNeedsAttention") }}
          </option>
          <option value="blocked">{{ store.t("statusBlocked") }}</option>
          <option value="in-repair">{{ store.t("statusInRepair") }}</option>
        </select>
      </div>

      <button @click="showModal = true" class="btn-primary gap-2 text-sm">
        <Plus :size="16" /> {{ store.t("addVehicle") }}
      </button>
    </div>

    <!-- Loading / Error -->
    <div v-if="vehicleStore.loading" class="card p-6 text-sm text-gray-500">
      Loading vehicles...
    </div>

    <div v-else-if="vehicleStore.error" class="card p-6 text-sm text-red-500">
      {{ vehicleStore.error }}
    </div>

    <template v-else>
      <!-- Summary badges -->
      <div class="flex flex-wrap gap-2 mb-5">
        <span class="badge-green">
          {{ vehicles.filter((v) => v.status === "active").length }}
          {{ store.t("statusActive") }}
        </span>

        <span class="badge-orange">
          {{ vehicles.filter((v) => v.status === "needs-attention").length }}
          {{ store.t("statusNeedsAttention") }}
        </span>

        <span class="badge-red">
          {{ vehicles.filter((v) => v.status === "blocked").length }}
          {{ store.t("statusBlocked") }}
        </span>

        <span class="badge-gray">
          {{ vehicles.filter((v) => v.status === "in-repair").length }}
          {{ store.t("statusInRepair") }}
        </span>
      </div>

      <!-- Table -->
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
                v-for="v in filtered"
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
                  {{ v.type }}
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
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <Pencil :size="14" />
                    </button>

                    <button
                      @click.stop="confirmDelete(v)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filtered.length === 0">
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
      </div>
    </template>

    <!-- Add/Edit Vehicle Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm"
            @click="closeModal"
          />

          <div
            class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <!-- Header -->
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800"
            >
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ editingId ? store.t("editVehicle") : store.t("addVehicle") }}
              </h2>

              <button
                @click="closeModal"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSave" class="p-6 space-y-5">
              <!-- Photo upload -->
              <div>
                <label class="label">{{ store.t("vehiclePhoto") }}</label>

                <div
                  class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors relative group"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="handleDrop"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileChange"
                  />

                  <template v-if="photoPreview">
                    <img
                      :src="photoPreview"
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

              <!-- Row 1: Vehicle Number + Type -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    {{ store.t("vehicleNumber") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.unit"
                    class="input-field"
                    placeholder="VH-001"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("type") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select v-model="form.type" class="input-field" required>
                    <option value="" disabled>
                      {{ store.t("selectType") }}
                    </option>
                    <option v-for="t in vehicleTypes" :key="t" :value="t">
                      {{ t }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Row 2: Make + Model -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    {{ store.t("make") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.make"
                    class="input-field"
                    placeholder="Toyota"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("model") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.model"
                    class="input-field"
                    placeholder="Camry"
                    required
                  />
                </div>
              </div>

              <!-- Row 3: Year + Plate Number -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">
                    {{ store.t("year") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="form.year"
                    class="input-field"
                    type="number"
                    placeholder="2023"
                    min="1990"
                    :max="new Date().getFullYear() + 1"
                    required
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("plateNumber") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.plate"
                    class="input-field"
                    placeholder="AA1234BC"
                    required
                  />
                </div>
              </div>

              <!-- Row 4: VIN + Odometer -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t("vin") }}</label>
                  <input
                    v-model="form.vin"
                    class="input-field"
                    placeholder="1HGBH41JXMN109186"
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("odometer") }}</label>
                  <input
                    v-model.number="form.odometer"
                    class="input-field"
                    type="number"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <!-- Row 5: Engine hours + Status -->
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">Engine Hours</label>
                  <input
                    v-model.number="form.engine_hours"
                    class="input-field"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label class="label">
                    {{ store.t("status") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <select v-model="form.status" class="input-field" required>
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

              <!-- Footer -->
              <div
                class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <button
                  type="button"
                  @click="closeModal"
                  class="btn-secondary px-5 py-2.5"
                >
                  {{ store.t("cancel") }}
                </button>

                <button type="submit" class="btn-primary px-6 py-2.5 gap-2">
                  <Save :size="16" /> {{ store.t("save") }}
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
import { useRouter } from "vue-router";
import {
  Search,
  Filter,
  Plus,
  X,
  Camera,
  Save,
  Pencil,
  Trash2,
} from "lucide-vue-next";

import AppLayout from "../components/layout/AppLayout.vue";
import { useAppStore } from "../stores/app";
import { useVehicleStore } from "@/stores/vehicleStore";
import { uploadVehiclePhoto } from "@/api/storage";

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
const vehicleStore = useVehicleStore();
const router = useRouter();

onMounted(() => {
  vehicleStore.fetchVehicles();
});

const search = ref("");
const filterStatus = ref("all");
const showModal = ref(false);
const editingId = ref<string | null>(null);
const photoPreview = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const selectedPhotoFile = ref<File | null>(null);

const vehicles = computed<Vehicle[]>(() => vehicleStore.vehicles as Vehicle[]);

const vehicleTypes = [
  "Truck",
  "Van",
  "Car",
  "Equipment",
  "Bus",
  "Trailer",
  "Pickup",
  "Other",
];

const vehicleStatuses = computed(() => [
  { value: "active", label: store.t("statusActive") },
  { value: "needs-attention", label: store.t("statusNeedsAttention") },
  { value: "blocked", label: store.t("statusBlocked") },
  { value: "in-repair", label: store.t("statusInRepair") },
]);

const defaultForm = () => ({
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

const form = ref(defaultForm());

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  form.value = defaultForm();
  photoPreview.value = null;
  selectedPhotoFile.value = null;
}

function getVehicleName(v: Vehicle) {
  return `${v.make || ""} ${v.model || ""}`.trim();
}

function startEdit(v: Vehicle) {
  form.value = {
    unit: v.unit || "",
    type: v.type || "",
    make: v.make || "",
    model: v.model || "",
    year: v.year || new Date().getFullYear(),
    plate: v.plate || "",
    vin: v.vin || "",
    odometer: v.odometer ?? 0,
    engine_hours: v.engine_hours ?? null,
    status: v.status || "active",
    photo_url: v.photo_url || "",
  };

  photoPreview.value = v.photo_url || null;
  editingId.value = v.id;
  showModal.value = true;
}

async function confirmDelete(v: Vehicle) {
  if (confirm(`Delete "${getVehicleName(v)}" (${v.unit})?`)) {
    await vehicleStore.deleteVehicle(v.id);
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  selectedPhotoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;

  selectedPhotoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

function removePhoto() {
  selectedPhotoFile.value = null;
  photoPreview.value = null;
  form.value.photo_url = "";
}

function hideBrokenImage(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}

async function handleSave() {
  console.log("SAVE CLICKED", form.value);

  let photoUrl = form.value.photo_url || null;

  if (selectedPhotoFile.value) {
    photoUrl = await uploadVehiclePhoto(selectedPhotoFile.value);
  }

  const vehiclePayload = {
    unit: form.value.unit,
    type: form.value.type,
    make: form.value.make,
    model: form.value.model,
    year: Number(form.value.year),
    plate: form.value.plate,
    vin: form.value.vin || null,
    odometer:
      form.value.odometer !== null && form.value.odometer !== undefined
        ? Number(form.value.odometer)
        : null,
    engine_hours:
      form.value.engine_hours !== null && form.value.engine_hours !== undefined
        ? Number(form.value.engine_hours)
        : null,
    status: form.value.status,
    photo_url: photoUrl,

    // тимчасовий company_id для MVP
    // не забути заміни пізніше на id моєї company з таблиці companies!!!
    company_id: "24119d61-05a7-4300-b57b-473ed31fc771",
  };
  console.log("PAYLOAD", vehiclePayload);

  if (editingId.value) {
    await vehicleStore.updateVehicle(editingId.value, vehiclePayload);
  } else {
    await vehicleStore.createVehicle(vehiclePayload);
  }

  closeModal();
}

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

const filtered = computed(() =>
  vehicles.value.filter((v) => {
    const searchValue = search.value.toLowerCase();
    const name = getVehicleName(v).toLowerCase();

    const matchSearch =
      name.includes(searchValue) ||
      String(v.unit || "")
        .toLowerCase()
        .includes(searchValue) ||
      String(v.plate || "")
        .toLowerCase()
        .includes(searchValue);

    const matchStatus =
      filterStatus.value === "all" || v.status === filterStatus.value;

    return matchSearch && matchStatus;
  })
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative {
  transform: scale(0.96) translateY(8px);
}

.modal-leave-to .relative {
  transform: scale(0.96) translateY(8px);
}
</style>
