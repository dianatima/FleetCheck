<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors"
  >
    <div class="card max-w-md w-full p-8 shadow-xl">
      <div class="text-center mb-6">
        <div
          class="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-5"
        >
          <KeyRound :size="34" class="text-blue-600 dark:text-blue-300" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set your password
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Create a password before entering your driver workspace.
        </p>
      </div>

      <form class="space-y-3" @submit.prevent="setPassword">
        <div
          v-if="passwordMessage"
          class="text-sm rounded-lg px-3 py-2"
          :class="
            passwordSaved
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
          "
        >
          {{ passwordMessage }}
        </div>

        <input
          v-model="password"
          class="input-field"
          type="password"
          autocomplete="new-password"
          placeholder="Password"
          minlength="6"
          required
        />
        <input
          v-model="confirmPassword"
          class="input-field"
          type="password"
          autocomplete="new-password"
          placeholder="Confirm password"
          minlength="6"
          required
        />

        <button
          class="btn-primary w-full py-2.5 justify-center"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? "Saving..." : "Save password" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { KeyRound } from "lucide-vue-next";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const router = useRouter();
const password = ref("");
const confirmPassword = ref("");
const passwordMessage = ref("");
const passwordSaved = ref(false);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.acceptDriverInvitation({ reportError: false });
  }
});

async function setPassword() {
  passwordSaved.value = false;

  if (password.value !== confirmPassword.value) {
    passwordMessage.value = "Passwords do not match.";
    return;
  }

  const success = await authStore.updatePassword(password.value);

  if (!success) {
    passwordMessage.value = authStore.error || "Password could not be saved.";
    return;
  }

  passwordSaved.value = true;
  passwordMessage.value = "Password saved.";
  await router.replace(authStore.redirectPath);
}
</script>
