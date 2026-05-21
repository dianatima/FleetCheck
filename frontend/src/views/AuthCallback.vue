<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Signing you in...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  await authStore.loadSession();
  await authStore.acceptDriverInvitation({ reportError: false });

  router.replace(authStore.redirectPath);
});
</script>
