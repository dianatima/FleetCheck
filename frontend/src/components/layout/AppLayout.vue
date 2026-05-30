<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
    <Sidebar />

    <!-- Top bar -->
    <header
      class="fixed top-0 left-0 lg:left-56 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 sm:px-6 gap-3 z-20"
    >
      <button
        class="lg:hidden min-h-[44px] min-w-[44px] rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        type="button"
        aria-label="Open navigation"
        @click="mobileMenuOpen = true"
      >
        <Menu :size="20" />
      </button>

      <h1 class="font-semibold text-gray-900 dark:text-white flex-1 truncate">
        {{ title }}
      </h1>

      <div class="flex items-center gap-1">
        <LanguageSelector :compact="true" />
        <ThemeToggle />
        <NotificationBell />

        <div class="ml-1 h-8 w-px bg-gray-200 dark:bg-gray-700" />

        <div class="flex items-center gap-2 pl-1">
          <div
            class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center overflow-hidden text-blue-600 dark:text-blue-400 font-semibold text-sm select-none"
          >
            <img
              v-if="authStore.profile?.avatar_url"
              :src="authStore.profile.avatar_url"
              class="w-full h-full object-cover"
              alt="Avatar"
            />

            <span v-else>
              {{ userInitial }}
            </span>
          </div>

          <div class="hidden sm:flex flex-col leading-tight">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
              {{ userName }}
            </span>

            <span
              class="text-xs text-gray-400 dark:text-gray-500 max-w-[160px] truncate"
            >
              {{ companyName }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        class="absolute inset-0 bg-gray-950/40"
        aria-label="Close navigation"
        @click="mobileMenuOpen = false"
      />
      <aside
        class="relative flex h-full w-[82vw] max-w-80 flex-col border-r border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex h-16 items-center justify-between border-b border-gray-100 px-4 dark:border-gray-800">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Truck :size="20" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">FleetCheck</p>
              <p class="text-xs text-blue-500">PRO</p>
            </div>
          </div>
          <button
            type="button"
            class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close navigation"
            @click="mobileMenuOpen = false"
          >
            <X :size="20" />
          </button>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto p-3">
          <button
            v-for="item in mobileItems"
            :key="item.to"
            type="button"
            class="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors"
            :class="isActiveMobileRoute(item.to)
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'"
            @click="navigateMobile(item.to)"
          >
            <component :is="item.icon" :size="19" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </aside>
    </div>

    <!-- Main content -->
    <main class="pt-16 lg:pl-56 pb-20 lg:pb-6">
      <div class="px-4 sm:px-6 py-5">
        <slot />
      </div>
    </main>

    <MobileNav />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-vue-next";

import Sidebar from "./Sidebar.vue";
import MobileNav from "./MobileNav.vue";
import ThemeToggle from "../shared/ThemeToggle.vue";
import LanguageSelector from "../shared/LanguageSelector.vue";
import NotificationBell from "../shared/NotificationBell.vue";

import { useAppStore } from "../../stores/app";
import { useAuthStore } from "@/stores/authStore";

defineProps<{ title: string }>();

const store = useAppStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const mobileMenuOpen = ref(false);

const mobileItems = computed(() =>
  authStore.role === "driver"
    ? [
        { icon: LayoutDashboard, label: store.t("driverDashboard"), to: "/driver" },
        { icon: Truck, label: store.t("vehicles"), to: "/driver/vehicles" },
        { icon: FileText, label: store.t("reports"), to: "/driver/reports" },
      ]
    : [
        { icon: LayoutDashboard, label: store.t("home"), to: "/dashboard" },
        { icon: Truck, label: store.t("vehicles"), to: "/vehicles" },
        { icon: Users, label: store.t("drivers"), to: "/drivers" },
        { icon: FileText, label: store.t("reports"), to: "/reports" },
        { icon: AlertTriangle, label: store.t("issues"), to: "/issues" },
        { icon: Wrench, label: store.t("repairs"), to: "/repairs" },
        { icon: Settings, label: store.t("settings"), to: "/settings" },
      ]
);

function navigateMobile(to: string) {
  mobileMenuOpen.value = false;
  router.push(to);
}

function isActiveMobileRoute(to: string) {
  if (to === "/driver") return route.path === "/driver";
  if (to === "/dashboard") return route.path === "/dashboard";
  return route.path === to || route.path.startsWith(`${to}/`);
}

const userName = computed(() => {
  const firstName = authStore.profile?.first_name || "";
  const lastName = authStore.profile?.last_name || "";

  return `${firstName} ${lastName}`.trim() || authStore.user?.email || "User";
});

const companyName = computed(() => {
  return (
    authStore.companyName ||
    authStore.currentCompany?.company_name ||
    authStore.profile?.company_name ||
    "Company"
  );
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase() || "U";
});
</script>
