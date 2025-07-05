<script setup lang="ts">
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { ConfigProvider } from "reka-ui";
import { RouterView, useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/shared/stores/user";
import { Toaster } from "@/shared/ui/toast";
import { RouteName } from "@/shared/lib/routes";

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

userStore.initializeUser();
</script>

<template>
  <ConfigProvider>
    <div class="flex h-svh flex-col">
      <RouterView />
    </div>
    <Toaster />
  </ConfigProvider>
</template>
