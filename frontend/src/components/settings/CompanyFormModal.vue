<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl"
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800"
          >
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ company ? "Edit company" : "Add company" }}
            </h2>

            <button
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X :size="18" />
            </button>
          </div>

          <form @submit.prevent="submit" class="p-6 space-y-4">
            <div>
              <label class="label">Company name *</label>
              <input v-model="form.name" class="input-field" required />
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="label">Phone</label>
                <input v-model="form.phone" class="input-field" />
              </div>

              <div>
                <label class="label">Industry</label>
                <select v-model="form.industry" class="input-field">
                  <option value="">Select industry</option>
                  <option
                    v-for="item in industryOptions"
                    :key="item"
                    :value="item"
                  >
                    {{ item }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="label">Distance unit</label>
              <select v-model="form.odometer_unit" class="input-field">
                <option
                  v-for="option in odometerUnitOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="label">Address</label>
              <input v-model="form.address" class="input-field" />
            </div>

            <div class="grid sm:grid-cols-3 gap-4">
              <div>
                <label class="label">Country</label>
                <input v-model="form.country" class="input-field" />
              </div>

              <div>
                <label class="label">State</label>
                <input v-model="form.state" class="input-field" />
              </div>

              <div>
                <label class="label">City</label>
                <input v-model="form.city" class="input-field" />
              </div>
            </div>

            <div
              class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800"
            >
              <button
                type="button"
                @click="close"
                class="btn-secondary px-5 py-2.5"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="btn-primary px-6 py-2.5"
                :disabled="loading"
              >
                {{ loading ? "Saving..." : "Save" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps<{
  modelValue: boolean;
  company?: any | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: any];
}>();

const industryOptions = [
  "Trucking / Freight",
  "Construction Equipment",
  "Boom Lift Rental",
  "Delivery Fleet",
  "Taxi / Passenger",
  "Service Vehicles",
  "Other",
];

const odometerUnitOptions = [
  { value: "mi", label: "Miles (mi)" },
  { value: "km", label: "Kilometers (km)" },
  { value: "nm", label: "Nautical miles (nm)" },
];

const form = reactive({
  name: "",
  phone: "",
  address: "",
  country: "",
  state: "",
  city: "",
  industry: "",
  odometer_unit: "mi",
});

watch(
  () => [props.modelValue, props.company],
  () => {
    if (!props.modelValue) return;

    Object.assign(form, {
      name: props.company?.company_name || props.company?.name || "",
      phone: props.company?.phone || "",
      address: props.company?.address || "",
      country: props.company?.country || "",
      state: props.company?.state || "",
      city: props.company?.city || "",
      industry: props.company?.industry || "",
      odometer_unit: props.company?.odometer_unit || "mi",
    });
  },
  { immediate: true }
);

function close() {
  emit("update:modelValue", false);
}

function submit() {
  console.log("COMPANY FORM SUBMIT", form);

  emit("save", {
    name: form.name,
    phone: form.phone || null,
    address: form.address || null,
    country: form.country || null,
    state: form.state || null,
    city: form.city || null,
    industry: form.industry || null,
    odometer_unit: form.odometer_unit || "mi",
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
