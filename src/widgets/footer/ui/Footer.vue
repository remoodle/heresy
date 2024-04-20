<script setup lang="ts">
import { MonoLogo } from "@/widgets/logo";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { useAppStore } from "@/shared/stores/app";
import APIVersion from "./APIVersion.vue";
import ClientVersion from "./ClientVersion.vue";

const appStore = useAppStore();

withDefaults(
  defineProps<{
    slim?: boolean;
  }>(),
  {
    slim: false,
  },
);
</script>

<template>
  <footer
    class="container flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
    :class="{ 'py-6': !slim }"
  >
    <MonoLogo />
    <div
      class="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t py-4"
    >
      <div class="flex flex-wrap gap-2 text-muted-foreground">
        <ClientVersion />
        <APIVersion
          v-if="appStore.selectedProvider"
          :host="appStore.selectedProvider.api"
        />
      </div>
      <ThemeSwitcher class="flex-none" />
    </div>
  </footer>
</template>
