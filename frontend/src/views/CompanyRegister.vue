<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <header
      class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800"
    >
      <div
        class="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft :size="16" /> {{ store.t("back") }}
        </RouterLink>

        <div class="flex items-center gap-2">
          <LanguageSelector :compact="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <!-- Step progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between relative">
          <div
            class="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0"
          />
          <div
            class="absolute left-0 top-4 h-0.5 bg-blue-500 -z-0 transition-all duration-500"
            :style="{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }"
          />

          <div
            v-for="s in steps"
            :key="s.id"
            class="flex flex-col items-center gap-2 relative z-10"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              :class="
                s.id < step
                  ? 'bg-blue-600 text-white'
                  : s.id === step
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-400'
              "
            >
              <CheckCircle v-if="s.id < step" :size="16" />
              <component v-else :is="s.icon" :size="14" />
            </div>

            <span
              class="text-xs font-medium hidden sm:block"
              :class="
                s.id === step
                  ? 'text-blue-600 dark:text-blue-400'
                  : s.id < step
                  ? 'text-gray-600 dark:text-gray-300'
                  : 'text-gray-400'
              "
            >
              {{ s.label }}
            </span>
          </div>
        </div>
      </div>

      <div class="card p-6 shadow-sm">
        <div
          v-if="authStore.error"
          class="mb-5 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg px-3 py-2"
        >
          {{ authStore.error }}
        </div>

        <!-- Step 1: Owner Account -->
        <div v-if="step === 1">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Create owner account
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
            This account will manage the company workspace.
          </p>

          <div class="space-y-4">
            <div>
              <label class="label">Email *</label>
              <input
                v-model="email"
                class="input-field"
                type="email"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label class="label">Password *</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPass ? 'text' : 'password'"
                  class="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  @click="showPass = !showPass"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <EyeOff v-if="showPass" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label class="label">Confirm password *</label>
              <div class="relative">
                <input
                  v-model="confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  class="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  @click="showConfirm = !showConfirm"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <EyeOff v-if="showConfirm" :size="16" />
                  <Eye v-else :size="16" />
                </button>
              </div>

              <p
                v-if="confirmPassword && password !== confirmPassword"
                class="text-xs text-red-500 mt-1"
              >
                Passwords do not match
              </p>
              <p
                v-else-if="confirmPassword && password === confirmPassword"
                class="text-xs text-green-500 mt-1"
              >
                Passwords match
              </p>
            </div>
          </div>
        </div>

        <!-- Step 2: Company Info -->
        <div v-else-if="step === 2">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Company information
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Tell us about your company.
          </p>

          <div class="grid sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="label">Company name *</label>
              <input
                v-model="company.name"
                class="input-field"
                placeholder="Acme Trucking Inc."
              />
            </div>

            <div>
              <label class="label">Country *</label>
              <select v-model="company.country" class="input-field">
                <option>United States</option>
                <option>Canada</option>
                <option>Ukraine</option>
                <option>Mexico</option>
                <option>France</option>
                <option>Spain</option>
              </select>
            </div>

            <div>
              <label class="label">State / Province</label>
              <input
                v-model="company.state"
                class="input-field"
                placeholder="California"
              />
            </div>

            <div>
              <label class="label">City</label>
              <input
                v-model="company.city"
                class="input-field"
                placeholder="Los Angeles"
              />
            </div>

            <div>
              <label class="label">Phone</label>
              <input
                v-model="company.phone"
                class="input-field"
                type="tel"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="label">Address</label>
              <input
                v-model="company.address"
                class="input-field"
                placeholder="123 Fleet Street"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="label">Industry type</label>
              <select v-model="company.industry" class="input-field">
                <option v-for="o in industryOptions" :key="o">{{ o }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 3: Owner Info -->
        <div v-else-if="step === 3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Owner information
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Provide the contact details of the company owner.
          </p>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="label">First name *</label>
              <input
                v-model="owner.firstName"
                class="input-field"
                placeholder="John"
              />
            </div>

            <div>
              <label class="label">Last name *</label>
              <input
                v-model="owner.lastName"
                class="input-field"
                placeholder="Smith"
              />
            </div>

            <div class="sm:col-span-2">
              <label class="label">Phone</label>
              <input
                v-model="owner.phone"
                class="input-field"
                type="tel"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        <!-- Step 4: Done -->
        <div v-else-if="step === 4" class="text-center py-6">
          <div
            class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle :size="40" class="text-green-500" />
          </div>

          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Workspace is ready
          </h2>

          <p class="text-gray-500 dark:text-gray-400 mb-2">
            Your company workspace and owner account have been created.
          </p>

          <RouterLink
            to="/dashboard"
            class="btn-primary px-8 py-3 text-base gap-2 inline-flex"
          >
            Go to Dashboard <ArrowRight :size="18" />
          </RouterLink>
        </div>
      </div>

      <div
        v-if="step < steps.length"
        class="flex items-center justify-between mt-5"
      >
        <button
          @click="step > 1 && step--"
          :disabled="step === 1 || authStore.loading"
          class="btn-secondary gap-2 disabled:opacity-40"
        >
          <ArrowLeft :size="16" /> Back
        </button>

        <span class="text-sm text-gray-400"
          >{{ step }} / {{ steps.length }}</span
        >

        <button
          @click="handleNext"
          :disabled="!canProceedCurrentStep || authStore.loading"
          class="btn-primary gap-2 disabled:opacity-40"
        >
          <span v-if="step === 3">
            {{ authStore.loading ? "Creating..." : "Create workspace" }}
          </span>
          <span v-else>Next</span>
          <ArrowRight :size="16" />
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle,
  KeyRound,
  CircleUser as UserCircle,
  Eye,
  EyeOff,
} from "lucide-vue-next";

import { useAppStore } from "../stores/app";
import { useAuthStore } from "@/stores/authStore";
import LanguageSelector from "../components/shared/LanguageSelector.vue";
import ThemeToggle from "../components/shared/ThemeToggle.vue";

const store = useAppStore();
const authStore = useAuthStore();
const router = useRouter();

const step = ref(1);

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPass = ref(false);
const showConfirm = ref(false);

const company = reactive({
  name: "",
  country: "United States",
  state: "",
  city: "",
  phone: "",
  address: "",
  industry: "Trucking / Freight",
});

const owner = reactive({
  firstName: "",
  lastName: "",
  phone: "",
});

const steps = computed(() => [
  { id: 1, icon: KeyRound, label: "Owner account" },
  { id: 2, icon: Building2, label: "Company" },
  { id: 3, icon: UserCircle, label: "Owner info" },
  { id: 4, icon: CheckCircle, label: "Finish" },
]);

const industryOptions = [
  "Trucking / Freight",
  "Construction Equipment",
  "Boom Lift Rental",
  "Delivery Fleet",
  "Taxi / Passenger Transport",
  "Service Vehicles",
  "Other Fleet",
];

const canProceedStep1 = computed(() => {
  return (
    email.value.trim().length > 0 &&
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  );
});

const canProceedStep2 = computed(() => {
  return company.name.trim().length > 0 && company.country.trim().length > 0;
});

const canProceedStep3 = computed(() => {
  return owner.firstName.trim().length > 0 && owner.lastName.trim().length > 0;
});

const canProceedCurrentStep = computed(() => {
  if (step.value === 1) return canProceedStep1.value;
  if (step.value === 2) return canProceedStep2.value;
  if (step.value === 3) return canProceedStep3.value;
  return true;
});

async function handleNext() {
  if (!canProceedCurrentStep.value) return;

  if (step.value === 3) {
    const success = await authStore.registerOwnerWithCompany({
      company: {
        name: company.name,
        country: company.country,
        state: company.state,
        city: company.city,
        address: company.address,
        phone: company.phone,
        industry: company.industry,
      },
      owner: {
        first_name: owner.firstName,
        last_name: owner.lastName,
        email: email.value,
        phone: owner.phone,
        password: password.value,
      },
    });

    if (success) {
      step.value = 4;

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    }

    return;
  }

  if (step.value < steps.value.length) {
    step.value++;
  }
}
</script>
