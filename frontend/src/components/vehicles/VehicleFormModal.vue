<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800"
          >
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ vehicle ? store.t("editVehicle") : store.t("addVehicle") }}
            </h2>

            <button
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="submitForm" class="p-6 space-y-5">
            <div>
              <label class="label">{{ store.t("vehiclePhoto") }}</label>

              <div
                class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                @click="fileInput?.click()"
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

                <template v-if="photoPreview || form.photo_url">
                  <img
                    :src="photoPreview || form.photo_url"
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
                <label class="label"
                  >{{ store.t("vehicleNumber") }}
                  <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.unit"
                  class="input-field"
                  placeholder="VH-001"
                  required
                />
              </div>

              <div>
                <label class="label"
                  >{{ store.t("type") }}
                  <span class="text-red-500">*</span></label
                >
                <select v-model="form.vehicle_type_id" class="input-field" required>
                  <option value="" disabled>{{ store.t("selectType") }}</option>
                  <option
                    v-for="vehicleType in vehicleStore.vehicleTypes"
                    :key="vehicleType.id"
                    :value="vehicleType.id"
                  >
                    {{ vehicleType.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="label"
                  >{{ store.t("make") }}
                  <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.make"
                  class="input-field"
                  placeholder="Toyota"
                  required
                />
              </div>

              <div>
                <label class="label"
                  >{{ store.t("model") }}
                  <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.model"
                  class="input-field"
                  placeholder="Camry"
                  required
                />
              </div>

              <div>
                <label class="label"
                  >{{ store.t("year") }}
                  <span class="text-red-500">*</span></label
                >
                <input
                  v-model.number="form.year"
                  class="input-field"
                  type="number"
                  min="1990"
                  :max="new Date().getFullYear() + 1"
                  required
                />
              </div>

              <div>
                <label class="label"
                  >{{ store.t("plateNumber") }}
                  <span class="text-red-500">*</span></label
                >
                <input
                  v-model="form.plate"
                  class="input-field"
                  placeholder="AA1234BC"
                  required
                />
              </div>

              <div>
                <label class="label">{{ store.t("vin") }}</label>
                <input v-model="form.vin" class="input-field" />
              </div>

              <div>
                <label class="label">{{ store.t("odometer") }}</label>
                <input
                  v-model.number="form.odometer"
                  class="input-field"
                  type="number"
                  min="0"
                />
              </div>

              <div>
                <label class="label">Odometer unit</label>
                <select v-model="form.odometer_unit" class="input-field">
                  <option value="mi">Miles (mi)</option>
                  <option value="km">Kilometers (km)</option>
                </select>
              </div>

              <div>
                <label class="label">{{ store.t("engineHours") }}</label>
                <input
                  v-model.number="form.engine_hours"
                  class="input-field"
                  type="number"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label class="label"
                  >{{ store.t("status") }}
                  <span class="text-red-500">*</span></label
                >
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

            <div
              class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800"
            >
              <button
                type="button"
                @click="close"
                class="btn-secondary px-5 py-2.5"
              >
                {{ store.t("cancel") }}
              </button>

              <button
                type="submit"
                class="btn-primary px-6 py-2.5 gap-2"
                :disabled="loading"
              >
                <Save :size="16" />
                {{ loading ? "Saving..." : store.t("save") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from "vue";
import { X, Camera, Save } from "lucide-vue-next";
import { useAppStore } from "@/stores/app";
import { useVehicleStore } from "@/stores/vehicleStore";
import { uploadVehiclePhoto } from "@/api/storage";

type VehicleStatus = "active" | "needs-attention" | "blocked" | "in-repair";

type Vehicle = {
  id: string;
  unit: string;
  make: string;
  model: string;
  vehicle_type_id: string;
  year: number;
  plate: string;
  vin?: string | null;
  odometer?: number | null;
  odometer_unit?: "km" | "mi" | null;
  engine_hours?: number | null;
  status: VehicleStatus;
  photo_url?: string | null;
};

const props = defineProps<{
  modelValue: boolean;
  vehicle?: Vehicle | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: any];
}>();

const store = useAppStore();
const vehicleStore = useVehicleStore();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedPhotoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);

const vehicleStatuses = computed(() => [
  { value: "active", label: store.t("statusActive") },
  { value: "needs-attention", label: store.t("statusNeedsAttention") },
  { value: "blocked", label: store.t("statusBlocked") },
  { value: "in-repair", label: store.t("statusInRepair") },
]);

const form = reactive({
  unit: "",
  vehicle_type_id: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  vin: "",
  odometer: 0 as number | null,
  odometer_unit: "mi" as "km" | "mi",
  engine_hours: null as number | null,
  status: "active" as VehicleStatus,
  photo_url: "",
});

function resetForm() {
  const v = props.vehicle;

  Object.assign(form, {
    unit: v?.unit || "",
    vehicle_type_id: v?.vehicle_type_id || "",
    make: v?.make || "",
    model: v?.model || "",
    year: v?.year || new Date().getFullYear(),
    plate: v?.plate || "",
    vin: v?.vin || "",
    odometer: v?.odometer ?? 0,
    odometer_unit: v?.odometer_unit || "mi",
    engine_hours: v?.engine_hours ?? null,
    status: v?.status || "active",
    photo_url: v?.photo_url || "",
  });

  selectedPhotoFile.value = null;
  photoPreview.value = null;
}

watch(
  () => [props.modelValue, props.vehicle],
  async () => {
    if (props.modelValue) {
      resetForm();
      await vehicleStore.fetchVehicleTypes();
    }
  },
  { immediate: true }
);

function close() {
  emit("update:modelValue", false);
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
  form.photo_url = "";
}

async function submitForm() {
  let photoUrl = form.photo_url || null;

  if (selectedPhotoFile.value) {
    photoUrl = await uploadVehiclePhoto(selectedPhotoFile.value);
  }

  emit("save", {
    unit: form.unit,
    vehicle_type_id: form.vehicle_type_id,
    make: form.make,
    model: form.model,
    year: Number(form.year),
    plate: form.plate,
    vin: form.vin || null,
    odometer:
      form.odometer !== null && form.odometer !== undefined
        ? Number(form.odometer)
        : null,
    odometer_unit: form.odometer_unit,
    engine_hours:
      form.engine_hours !== null && form.engine_hours !== undefined
        ? Number(form.engine_hours)
        : null,
    status: form.status,
    photo_url: photoUrl,
  });
}
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
</style>
