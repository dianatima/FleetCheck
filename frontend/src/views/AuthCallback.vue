<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Signing you in...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

onMounted(async () => {
  await authStore.loadSession();

  const joinCode = typeof route.query.code === 'string' ? route.query.code.trim().toUpperCase() : '';

  if (joinCode && authStore.profile?.role === 'driver') {
    await authStore.joinDriverCompanyWithCode(joinCode);
  }

  if (authStore.profile?.role === "driver" && authStore.profile?.status === 'pending') {
    router.replace('/pending');
  } else if (authStore.profile?.role === "driver") {
    router.replace("/driver");
  } else {
    router.replace("/dashboard");
  }
});
</script>
