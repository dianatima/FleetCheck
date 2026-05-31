<template>
  <AppLayout :title="store.t('settings')">
    <div
      class="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="selectTab(tab.id)"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
        :class="
          activeTab === tab.id
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        "
      >
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Company Profile -->
    <div v-if="activeTab === 'company'" class="space-y-5">
      <div class="card p-6">
        <div class="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 class="font-bold text-gray-900 dark:text-white">
              Company Profile
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Current company information.
            </p>
          </div>

          <button @click="openAddCompany" class="btn-primary text-sm">
            <Plus :size="15" />
            Add company
          </button>
        </div>

        <div
          v-if="authStore.ownerCompanies.length === 0"
          class="text-sm text-gray-500"
        >
          No companies found.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="company in authStore.ownerCompanies"
            :key="company.company_id"
            class="border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            :class="
              company.company_id === authStore.companyId
                ? 'bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-900'
            "
          >
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white">
                  {{ company.company_name }}
                </h3>

                <span
                  v-if="company.company_id === authStore.companyId"
                  class="badge-blue"
                >
                  Current
                </span>
              </div>

              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ company.industry || "No industry" }}
              </p>

              <p class="text-xs text-gray-400 mt-1">
                {{ formatCompanyAddress(company) }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="company.company_id !== authStore.companyId"
                @click="setCurrentCompany(company.company_id)"
                class="btn-secondary text-sm px-3 py-2"
              >
                Set current
              </button>

              <button
                @click="openEditCompany(company)"
                class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <Pencil :size="15" />
              </button>

              <button
                @click="deleteCompany(company)"
                class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 :size="15" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Profile -->
    <div v-else-if="activeTab === 'user'" class="card p-6">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">User Profile</h2>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Edit your personal account information.
      </p>

      <form @submit.prevent="saveUserProfile" class="space-y-5">
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="userForm.avatar_url"
              :src="userForm.avatar_url"
              class="w-full h-full object-cover"
            />

            <span
              v-else
              class="text-blue-600 dark:text-blue-400 font-bold text-xl"
            >
              {{ userInitial }}
            </span>
          </div>

          <div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarChange"
            />

            <button
              type="button"
              @click="avatarInput?.click()"
              class="btn-secondary text-sm"
            >
              Upload avatar
            </button>

            <button
              v-if="userForm.avatar_url"
              type="button"
              @click="removeAvatar"
              class="ml-2 text-sm text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">First name</label>
            <input v-model="userForm.first_name" class="input-field" />
          </div>

          <div>
            <label class="label">Last name</label>
            <input v-model="userForm.last_name" class="input-field" />
          </div>

          <div>
            <label class="label">Email</label>
            <input v-model="userForm.email" class="input-field" type="email" />
          </div>

          <div>
            <label class="label">Phone</label>
            <input v-model="userForm.phone" class="input-field" />
          </div>
        </div>

        <button type="submit" class="btn-primary text-sm" :disabled="saving">
          {{ saving ? "Saving..." : "Save profile" }}
        </button>
      </form>
    </div>

    <!-- Language -->
    <div v-else-if="activeTab === 'language'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">
        {{ store.t("languageSettings") }}
      </h2>

      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {{ store.t("chooseLanguage") }}
      </p>

      <div class="space-y-2">
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="store.setLanguage(lang.code)"
          class="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all"
          :class="
            store.language === lang.code
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
          "
        >
          <span class="text-2xl">{{ lang.flag }}</span>

          <div class="flex-1 text-left">
            <p class="font-medium">
              {{ lang.name }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ lang.native }}
            </p>
          </div>

          <div
            v-if="store.language === lang.code"
            class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
          >
            <Check :size="13" class="text-white" />
          </div>
        </button>
      </div>
    </div>

    <!-- Theme -->
    <div v-else-if="activeTab === 'theme'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">
        {{ store.t("appearance") }}
      </h2>

      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {{ store.t("customizeAppearance") }}
      </p>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="opt in themeOptions"
          :key="opt.id"
          @click="selectTheme(opt.id)"
          class="p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all"
          :class="
            appTheme === opt.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
          "
        >
          <div
            class="w-full h-16 rounded-lg border flex items-center justify-center overflow-hidden"
            :class="opt.preview"
          >
            <component :is="opt.icon" :size="20" :class="opt.iconClass" />
          </div>

          <span class="text-sm font-medium">
            {{ opt.label }}
          </span>

          <div
            v-if="appTheme === opt.id"
            class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"
          >
            <Check :size="11" class="text-white" />
          </div>
        </button>
      </div>
    </div>

    <div v-else-if="activeTab === 'driver-preview'" class="card p-5">
      <h2 class="font-bold text-gray-900 dark:text-white mb-1">Driver Preview (DEV)</h2>
      <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Test driver flows using company vehicles without switching accounts.
      </p>

      <div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Preview mode</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ previewEnabled ? 'Enabled: driver pages and navigation are active.' : 'Disabled: normal manager navigation is active.' }}
            </p>
          </div>
          <button
            type="button"
            class="px-3 py-2 text-sm"
            :class="previewEnabled ? 'btn-secondary' : 'btn-primary'"
            @click="toggleDriverPreview"
          >
            {{ previewEnabled ? 'Disable' : 'Enable' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Vehicle Access Rules -->
    <div v-else-if="activeTab === 'vehicle-access'" class="card overflow-hidden">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 class="font-bold text-gray-900 dark:text-white">
            Vehicle Access Rules
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Allow license classes to inspect and use specific vehicle types.
          </p>
        </div>

        <button class="btn-primary gap-2 text-sm" @click="openAddAccessRule">
          <Plus :size="15" />
          Create rule
        </button>
      </div>

      <div v-if="rulesStore.loading" class="p-6 text-sm text-gray-500">
        Loading vehicle access rules...
      </div>
      <div v-else-if="rulesStore.error" class="p-6 text-sm text-red-500">
        {{ rulesStore.error }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header-row">
              <th class="settings-th">License Class</th>
              <th class="settings-th">Allowed Vehicle Types</th>
              <th class="settings-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rulesStore.groupedRules.length === 0">
              <td colspan="3" class="px-6 py-12 text-center text-sm text-gray-400">
                No vehicle access rules configured.
              </td>
            </tr>
            <tr
              v-for="rule in rulesStore.groupedRules"
              :key="rule.license_class"
              class="border-b border-gray-50 dark:border-gray-700/50"
            >
              <td class="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {{ rule.license_class }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="vehicleType in rule.vehicle_types"
                    :key="vehicleType.id"
                    class="badge-gray"
                  >
                    {{ vehicleType.name }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <button
                    class="settings-icon-btn hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    title="Edit rule"
                    @click="openEditAccessRule(rule)"
                  >
                    <Pencil :size="15" />
                  </button>
                  <button
                    class="settings-icon-btn hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    title="Delete rule"
                    @click="deleteAccessRule(rule)"
                  >
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inspection Templates -->
    <div v-else-if="activeTab === 'inspection-templates'">
      <InspectionTemplatesManager />
    </div>

    <!-- Inspection Item Categories -->
    <div v-else-if="activeTab === 'inspection-item-categories'">
      <InspectionItemCategoriesManager />
    </div>

    <CompanyFormModal
      v-model="showCompanyModal"
      :company="editingCompany"
      :loading="saving"
      @save="saveCompany"
    />
    <VehicleAccessRuleFormModal
      v-model="showAccessRuleModal"
      :rule="editingAccessRule"
      :loading="rulesStore.loading"
      @save="saveAccessRule"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Building2,
  ClipboardList,
  Globe,
  Tags,
  Sun,
  Moon,
  Check,
  User,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
} from "lucide-vue-next";

import { supabase } from "@/lib/supabase";
import { useAppStore } from "../stores/app";
import { useAuthStore } from "@/stores/authStore";
import type { Language } from "../stores/app";
import AppLayout from "../components/layout/AppLayout.vue";
import CompanyFormModal from "@/components/settings/CompanyFormModal.vue";
import VehicleAccessRuleFormModal from "@/components/settings/VehicleAccessRuleFormModal.vue";
import InspectionTemplatesManager from "@/components/inspection-templates/InspectionTemplatesManager.vue";
import InspectionItemCategoriesManager from "@/components/settings/InspectionItemCategoriesManager.vue";
import {
  useVehicleAccessRulesStore,
  type VehicleAccessRulePayload,
} from "@/stores/vehicleAccessRulesStore";
import {
  canUseDevDriverPreview,
  isDevDriverPreviewEnabled,
  setDevDriverPreviewEnabled,
} from "@/lib/devDriverPreview";

const store = useAppStore();
const authStore = useAuthStore();
const rulesStore = useVehicleAccessRulesStore();
const route = useRoute();
const router = useRouter();

const activeTab = ref("company");
const appTheme = ref<"light" | "dark">(store.theme as "light" | "dark");
const saving = ref(false);

const showCompanyModal = ref(false);
const editingCompany = ref<any | null>(null);
const showAccessRuleModal = ref(false);
const editingAccessRule = ref<any | null>(null);

const avatarInput = ref<HTMLInputElement | null>(null);
const selectedAvatarFile = ref<File | null>(null);
const previewEnabled = ref(isDevDriverPreviewEnabled());

const tabs = computed(() => {
  const baseTabs = [
    { id: "company", icon: Building2, label: "Company Profile" },
    { id: "user", icon: User, label: "User Profile" },
    { id: "language", icon: Globe, label: store.t("languageSettings") },
    { id: "theme", icon: Sun, label: store.t("appearance") },
    { id: "vehicle-access", icon: KeyRound, label: "Vehicle Access Rules" },
    { id: "inspection-templates", icon: ClipboardList, label: store.t("inspectionTemplates") },
    { id: "inspection-item-categories", icon: Tags, label: "Inspection Item Categories" },
  ];

  if (canUseDevDriverPreview() && authStore.role !== "driver") {
    baseTabs.push({ id: "driver-preview", icon: User, label: "Driver Preview (DEV)" });
  }

  if (authStore.role === "driver") {
    return baseTabs.filter((tab) => !["vehicle-access", "inspection-templates", "inspection-item-categories"].includes(tab.id));
  }

  return baseTabs;
});

const languages = [
  { code: "en" as Language, flag: "🇺🇸", name: "English", native: "English" },
  {
    code: "uk" as Language,
    flag: "🇺🇦",
    name: "Ukrainian",
    native: "Українська",
  },
  { code: "es" as Language, flag: "🇪🇸", name: "Spanish", native: "Español" },
  { code: "fr" as Language, flag: "🇫🇷", name: "French", native: "Français" },
];

const themeOptions = computed(() => [
  {
    id: "light",
    icon: Sun,
    label: store.t("lightMode"),
    preview: "bg-white border-gray-200",
    iconClass: "text-gray-700",
  },
  {
    id: "dark",
    icon: Moon,
    label: store.t("darkMode"),
    preview: "bg-gray-900 border-gray-700",
    iconClass: "text-gray-200",
  },
]);

const userForm = reactive({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  avatar_url: "",
});

const userInitial = computed(() => {
  return (userForm.first_name || userForm.email || "U").charAt(0).toUpperCase();
});

watch(
  () => authStore.profile,
  () => fillUserForm(),
  { immediate: true }
);

onMounted(async () => {
  syncActiveTabFromRoute();

  if (!authStore.profile) {
    await authStore.fetchProfile();
  }

  await authStore.fetchOwnerCompanies();
  await rulesStore.fetchRules();
  await rulesStore.fetchVehicleTypes();
  fillUserForm();
});

watch(
  () => route.query.tab,
  () => syncActiveTabFromRoute()
);

watch(
  tabs,
  () => {
    if (!tabs.value.some((item) => item.id === activeTab.value)) {
      activeTab.value = "company";
      router.replace({ path: "/settings" });
    }
  }
);

watch(
  () => authStore.companyId,
  async (companyId) => {
    if (companyId) await rulesStore.fetchRules();
  }
);

function fillUserForm() {
  if (!authStore.profile) return;

  userForm.first_name = authStore.profile.first_name || "";
  userForm.last_name = authStore.profile.last_name || "";
  userForm.email = authStore.profile.email || "";
  userForm.phone = authStore.profile.phone || "";
  userForm.avatar_url = authStore.profile.avatar_url || "";
}

function selectTheme(id: string) {
  appTheme.value = id as "light" | "dark";

  if (id === "light" && store.theme === "dark") store.toggleTheme();
  if (id === "dark" && store.theme === "light") store.toggleTheme();
}

function syncActiveTabFromRoute() {
  const tab = String(route.query.tab || "");
  if (tabs.value.some((item) => item.id === tab)) {
    activeTab.value = tab;
  }
}

function selectTab(tabId: string) {
  activeTab.value = tabId;
  const nextQuery = tabId === "company" ? {} : { tab: tabId };
  router.replace({ path: "/settings", query: nextQuery });
}

function toggleDriverPreview() {
  const next = !previewEnabled.value;
  setDevDriverPreviewEnabled(next);
  previewEnabled.value = next;

  if (next) {
    router.replace("/driver");
    return;
  }

  router.replace("/dashboard");
}

function formatCompanyAddress(company: any) {
  return (
    [company.country, company.state, company.city, company.address]
      .filter(Boolean)
      .join(", ") || "No address"
  );
}

function openAddCompany() {
  editingCompany.value = null;
  showCompanyModal.value = true;
}

function openEditCompany(company: any) {
  editingCompany.value = company;
  showCompanyModal.value = true;
}

function openAddAccessRule() {
  editingAccessRule.value = null;
  showAccessRuleModal.value = true;
}

function openEditAccessRule(rule: any) {
  editingAccessRule.value = rule;
  showAccessRuleModal.value = true;
}

async function saveAccessRule(payload: VehicleAccessRulePayload) {
  const ok = editingAccessRule.value
    ? await rulesStore.updateRules(editingAccessRule.value.license_class, payload)
    : await rulesStore.createRules(payload);

  if (ok) {
    showAccessRuleModal.value = false;
    editingAccessRule.value = null;
  }
}

async function deleteAccessRule(rule: any) {
  if (!confirm(`Delete access rules for "${rule.license_class}"?`)) return;
  await rulesStore.deleteRules(rule.license_class);
}

async function saveCompany(payload: any) {
  console.log("SAVE COMPANY PAYLOAD", payload);
  console.log("EDITING COMPANY", editingCompany.value);

  saving.value = true;
  authStore.error = null;

  let ok = true;

  if (editingCompany.value) {
    const { error } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", editingCompany.value.company_id);

    if (error) {
      authStore.error = error.message;
      ok = false;
    }
  } else {
    ok = await authStore.createCompany(payload);
  }

  if (!ok) {
    saving.value = false;
    return;
  }

  await authStore.fetchProfile();
  await authStore.fetchOwnerCompanies();
  await authStore.fetchProfile();

  saving.value = false;
  showCompanyModal.value = false;
  editingCompany.value = null;
}

function setCurrentCompany(companyId: string) {
  authStore.setActiveCompany(companyId);
  window.location.reload();
}

async function deleteCompany(company: any) {
  if (!confirm(`Delete company "${company.company_name}"?`)) return;

  saving.value = true;

  const { error: ownerError } = await supabase
    .from("company_owners")
    .delete()
    .eq("company_id", company.company_id)
    .eq("profile_id", authStore.profile.id);

  if (ownerError) {
    authStore.error = ownerError.message;
    saving.value = false;
    return;
  }

  const { error: companyError } = await supabase
    .from("companies")
    .delete()
    .eq("id", company.company_id);

  if (companyError) {
    authStore.error = companyError.message;
    saving.value = false;
    return;
  }

  await authStore.fetchOwnerCompanies();

  if (authStore.companyId === company.company_id) {
    const nextCompanyId = authStore.ownerCompanies[0]?.company_id || null;

    if (nextCompanyId) {
      authStore.setActiveCompany(nextCompanyId);
    }
  }

  saving.value = false;
  window.location.reload();
}

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  selectedAvatarFile.value = file;
  userForm.avatar_url = URL.createObjectURL(file);
}

function removeAvatar() {
  selectedAvatarFile.value = null;
  userForm.avatar_url = "";
}

async function uploadAvatarIfNeeded() {
  if (!selectedAvatarFile.value || !authStore.user?.id) {
    return userForm.avatar_url || null;
  }

  const file = selectedAvatarFile.value;
  const ext = file.name.split(".").pop();
  const path = `profiles/${authStore.user.id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  return data.publicUrl;
}

async function saveUserProfile() {
  if (!authStore.user?.id) return;

  saving.value = true;

  try {
    const avatarUrl = await uploadAvatarIfNeeded();

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: userForm.first_name || null,
        last_name: userForm.last_name || null,
        email: userForm.email || null,
        phone: userForm.phone || null,
        avatar_url: avatarUrl,
      })
      .eq("auth_user_id", authStore.user.id);

    if (error) {
      authStore.error = error.message;
      saving.value = false;
      return;
    }

    await authStore.fetchProfile();
    selectedAvatarFile.value = null;
  } catch (e: any) {
    authStore.error = e.message || "Avatar upload failed";
  }

  saving.value = false;
}
</script>

<style scoped>
.badge-blue {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400;
}

.settings-th {
  @apply text-left text-[11px] font-medium tracking-normal text-gray-500 dark:text-gray-400 px-6 py-3.5 whitespace-nowrap;
}

.settings-icon-btn {
  @apply w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors;
}
</style>
