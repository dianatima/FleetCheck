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
              {{ driver ? store.t("editDriver") : store.t("addDriver") }}
            </h2>

            <button
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="submitForm" class="p-6 space-y-6">
            <section>
              <h3 class="section-title">
                <User :size="15" class="text-blue-500" />
                {{ store.t("personalInformation") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label"
                    >{{ store.t("firstName") }}
                    <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="form.firstName"
                    class="input-field"
                    required
                  />
                </div>

                <div>
                  <label class="label"
                    >{{ store.t("lastName") }}
                    <span class="text-red-500">*</span></label
                  >
                  <input v-model="form.lastName" class="input-field" required />
                </div>

                <div>
                  <label class="label"
                    >{{ store.t("emailField") }}
                    <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="form.email"
                    class="input-field"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("phone") }}</label>
                  <input v-model="form.phone" class="input-field" />
                </div>

                <div>
                  <label class="label">{{ store.t("dateOfBirth") }}</label>
                  <input
                    v-model="form.birthday"
                    class="input-field"
                    type="date"
                  />
                </div>

                <div>
                  <label class="label">{{ store.t("status") }}</label>
                  <select v-model="form.status" class="input-field" required>
                    <option
                      v-for="s in driverStatuses"
                      :key="s.value"
                      :value="s.value"
                    >
                      {{ s.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="mt-4">
                <label class="label">{{ store.t("homeAddress") }}</label>
                <div class="relative">
                  <MapPin
                    :size="15"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input v-model="form.address" class="input-field pl-9" />
                </div>
              </div>
            </section>

            <section
              class="border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/40 dark:bg-red-900/10"
            >
              <h3 class="section-title text-red-600 dark:text-red-400">
                <Heart :size="15" />
                {{ store.t("emergencyContact") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t("contactName") }}</label>
                  <input v-model="form.emergencyName" class="input-field" />
                </div>

                <div>
                  <label class="label">{{ store.t("contactPhone") }}</label>
                  <input v-model="form.emergencyPhone" class="input-field" />
                </div>
              </div>
            </section>

            <section
              class="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <h3 class="section-title">
                <FileText :size="15" class="text-blue-500" />
                {{ store.t("driverLicense") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t("licenseNumber") }}</label>
                  <input v-model="form.licenseNo" class="input-field" />
                </div>

                <div>
                  <label class="label">{{ store.t("licenseClass") }}</label>
                  <select v-model="form.licenseClass" class="input-field">
                    <option value="">{{ store.t("selectClass") }}</option>
                    <option v-for="c in licenseClasses" :key="c" :value="c">
                      {{ c }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="label">{{ store.t("expiryDate") }}</label>
                  <input
                    v-model="form.licenseExpiry"
                    class="input-field"
                    type="date"
                  />
                </div>
              </div>
            </section>

            <section
              class="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <h3 class="section-title">
                <FileText :size="15" class="text-green-500" />
                {{ store.t("medicalCard") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{
                    store.t("medicalCardNumber")
                  }}</label>
                  <input v-model="form.medCardNo" class="input-field" />
                </div>

                <div>
                  <label class="label">{{ store.t("expiryDate") }}</label>
                  <input
                    v-model="form.medCardExpiry"
                    class="input-field"
                    type="date"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 class="section-title">
                <Briefcase :size="15" class="text-blue-500" />
                {{ store.t("employment") }}
              </h3>

              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="label">{{ store.t("hireDate") }}</label>
                  <input
                    v-model="form.hireDate"
                    class="input-field"
                    type="date"
                  />
                </div>
              </div>
            </section>

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
                {{ loading ? "Saving..." : store.t("saveDriver") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from "vue";
import {
  X,
  Save,
  User,
  MapPin,
  Heart,
  FileText,
  Briefcase,
} from "lucide-vue-next";
import { useAppStore } from "@/stores/app";

type DriverStatus = "active" | "pending" | "inactive";

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
  status: DriverStatus;
};

const props = defineProps<{
  modelValue: boolean;
  driver?: Driver | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: any];
}>();

const store = useAppStore();

const licenseClasses = [
  "Class A",
  "Class B",
  "Class C",
  "Class D",
  "Class E",
  "CDL",
];

const driverStatuses = computed(() => [
  { value: "active", label: store.t("statusActive") },
  { value: "pending", label: store.t("statusPending") },
  { value: "inactive", label: store.t("statusInactive") },
]);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  licenseNo: "",
  licenseClass: "",
  licenseExpiry: "",
  medCardNo: "",
  medCardExpiry: "",
  hireDate: "",
  status: "active" as DriverStatus,
});

function splitName(name: string) {
  const parts = name.trim().split(" ");
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

function resetForm() {
  const current = props.driver;

  if (current) {
    const { firstName, lastName } = splitName(current.name || "");

    Object.assign(form, {
      firstName,
      lastName,
      email: current.email || "",
      phone: current.phone || "",
      birthday: current.birthday || "",
      address: current.address || "",
      emergencyName: current.emergency_name || "",
      emergencyPhone: current.emergency_phone || "",
      licenseNo: current.license_no || "",
      licenseClass: current.license_class || "",
      licenseExpiry: current.license_expiry || "",
      medCardNo: current.med_card_no || "",
      medCardExpiry: current.med_card_expiry || "",
      hireDate: current.hire_date || "",
      status: current.status || "active",
    });

    return;
  }

  Object.assign(form, {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    licenseNo: "",
    licenseClass: "",
    licenseExpiry: "",
    medCardNo: "",
    medCardExpiry: "",
    hireDate: "",
    status: "active",
  });
}

watch(
  () => [props.modelValue, props.driver],
  () => {
    if (props.modelValue) resetForm();
  },
  { immediate: true }
);

function close() {
  emit("update:modelValue", false);
}

function submitForm() {
  emit("save", {
    name: `${form.firstName} ${form.lastName}`.trim(),
    email: form.email,
    phone: form.phone || null,
    birthday: form.birthday || null,
    address: form.address || null,
    emergency_name: form.emergencyName || null,
    emergency_phone: form.emergencyPhone || null,
    license_no: form.licenseNo || null,
    license_class: form.licenseClass || null,
    license_expiry: form.licenseExpiry || null,
    med_card_no: form.medCardNo || null,
    med_card_expiry: form.medCardExpiry || null,
    hire_date: form.hireDate || null,
    status: form.status,
  });
}
</script>

<style scoped>
.section-title {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2;
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
