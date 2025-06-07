<script setup lang="ts">
import { onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import type { IUser } from "@remoodle/types";
import { RouterView, useRoute, useRouter } from "vue-router";
import { useUrlSearchParams } from "@vueuse/core";
import { ConfigProvider } from "reka-ui";
import { useUserStore } from "@/shared/stores/user";
import { RouteName } from "@/shared/lib/routes";
import Toaster from "@/shared/ui/toast/Toaster.vue";

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();
const { authorized } = storeToRefs(userStore);

watch(authorized, async (now, was) => {
  if (was && !now && route.meta.auth === "required") {
    await router.push({
      name: RouteName.Login,
      query: { next: route.fullPath },
    });
  }

  if (!was && now && route.meta.auth === "forbidden") {
    const redirectTo = route.query.next as string;

    if (redirectTo) {
      await router.push(redirectTo);
      return;
    }

    await router.push({ name: RouteName.Home });
  }
});

onMounted(() => {
  if (authorized.value && userStore.user) {
    userStore.identify(userStore.user);
    return;
  }

  const params = useUrlSearchParams("history");
  const usr = params.usr as string | undefined;

  if (!usr) {
    return;
  }

  const data = atob(usr);
  const resp = JSON.parse(data) as {
    user: IUser;
    accessToken: string;
    refreshToken: string;
  };

  if (resp.user) {
    userStore.login(resp.accessToken, resp.refreshToken, resp.user);
  }
});
</script>

<template>
  <ConfigProvider>
    <div class="flex h-svh flex-col">
      <RouterView />
    </div>
    <Toaster />
  </ConfigProvider>
</template>
