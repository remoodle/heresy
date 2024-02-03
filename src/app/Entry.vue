<script setup lang="ts">
import { watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { Footer } from "@/widgets/footer";
import { useUserStore } from "@/shared/stores/user";
import Toaster from "@/shared/ui/toast/Toaster.vue";

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();

watch(
  () => userStore.authorized,
  (now, was) => {
    if (was && !now && route.meta.auth === "required") {
      router.push({ name: "login", query: { next: route.fullPath } });
    }

    if (!was && now && route.meta.auth === "forbidden") {
      const redirectTo = route.query.next as string;

      if (redirectTo) {
        return router.push(redirectTo);
      }

      router.push({ name: "dashboard" });
    }
  },
);
</script>

<template>
  <div class="flex min-h-[100svh] flex-col">
    <!-- <div class="top-0 sticky">
      <div
        class="flex h-16 w-full justify-center bg-base-200 text-base-content shadow-sm transition-all duration-100"
      >
        ReMoodle
      </div>
    </div> -->
    <div class="my-10">
      <div class="-my-10 overflow-x-hidden">
        <RouterView />
      </div>
    </div>
    <Footer />
  </div>
  <Toaster />
</template>
