<script setup lang="ts">
import { ThemeSwitcher } from "@/features/theme-switcher";
import { getBuildInfo, isDefined } from "@/shared/utils";

const buildInfo = getBuildInfo();

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="container flex h-20 items-center justify-between border-t">
    <div>
      <span> © 2023-{{ currentYear }} ReMoodle </span>
      <span v-if="isDefined(buildInfo)"> v{{ buildInfo.version }} </span>
    </div>
    <ThemeSwitcher />
  </footer>
</template>
