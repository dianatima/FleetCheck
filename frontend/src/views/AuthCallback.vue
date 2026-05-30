<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="card p-6 text-center max-w-md w-full">
      <p class="text-gray-500 dark:text-gray-400">
        {{ callbackError || "Signing you in..." }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const authStore = useAuthStore();
const callbackError = ref("");

onMounted(async () => {
  const callbackInfo = readCallbackParams();
  const processed = await processAuthCallback(callbackInfo);

  if (!processed) {
    callbackError.value = authStore.error || "Invitation link could not be processed.";
    return;
  }

  await authStore.loadSession({ validateAccess: false });
  const acceptedInvite = await authStore.acceptDriverInvitation({ reportError: false });
  const authReady = await authStore.ensureAuthenticated();

  if (!authReady) {
    callbackError.value =
      authStore.error || "Your session could not be verified. Please sign in again.";
    await router.replace("/login");
    return;
  }

  if (callbackInfo.isDriverInvite && authStore.profile?.role !== "driver") {
    await authStore.forceLogout(
      "This driver invitation could not be opened with the current account. Please open the invitation again or use a private window.",
    );
    await router.replace("/login");
    return;
  }

  if (
    (acceptedInvite || callbackInfo.isDriverInvite || callbackInfo.isPasswordRecovery) &&
    authStore.profile?.role === "driver" &&
    !authStore.passwordSetAt
  ) {
    await router.replace("/set-password");
    return;
  }

  await router.replace(authStore.redirectPath);
});

type CallbackInfo = {
  code: string;
  tokenHash: string;
  accessToken: string;
  refreshToken: string;
  type: string;
  isDriverInvite: boolean;
  isPasswordRecovery: boolean;
};

function readCallbackParams(): CallbackInfo {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const type = queryParams.get("type") || hashParams.get("type") || "";
  const driverInvite =
    queryParams.get("driver_invite") === "1" ||
    hashParams.get("driver_invite") === "1";

  return {
    code: queryParams.get("code") || hashParams.get("code") || "",
    tokenHash: queryParams.get("token_hash") || hashParams.get("token_hash") || "",
    accessToken: queryParams.get("access_token") || hashParams.get("access_token") || "",
    refreshToken: queryParams.get("refresh_token") || hashParams.get("refresh_token") || "",
    type,
    isDriverInvite: driverInvite || type === "invite",
    isPasswordRecovery: driverInvite || type === "recovery",
  };
}

async function processAuthCallback(callbackInfo: CallbackInfo) {
  if (callbackInfo.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(callbackInfo.code);

    if (error) {
      authStore.error = error.message;
      return false;
    }

    removeAuthParamsFromUrl();
    return true;
  }

  if (callbackInfo.tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: callbackInfo.tokenHash,
      type: (callbackInfo.type || "invite") as any,
    });

    if (error) {
      authStore.error = error.message;
      return false;
    }

    removeAuthParamsFromUrl();
    return true;
  }

  if (callbackInfo.accessToken && callbackInfo.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: callbackInfo.accessToken,
      refresh_token: callbackInfo.refreshToken,
    });

    if (error) {
      authStore.error = error.message;
      return false;
    }

    removeAuthParamsFromUrl();
    return true;
  }

  return true;
}

function removeAuthParamsFromUrl() {
  window.history.replaceState({}, document.title, "/auth/callback");
}
</script>
