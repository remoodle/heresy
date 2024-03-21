<script setup lang="ts">
import { Logo } from "@/widgets/logo";
import { ThemeSwitcher } from "@/features/theme-switcher";
import APIVersion from "./APIVersion.vue";
import ClientVersion from "./ClientVersion.vue";
</script>

<template>
  <footer
    class="container flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-6"
  >
    <Logo />

    <div
      class="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t py-4"
    >
      <p class="text-muted-foreground">
        <ClientVersion />
        <APIVersion />
      </p>
      <ThemeSwitcher class="flex-none" />
    </div>
  </footer>
</template>
