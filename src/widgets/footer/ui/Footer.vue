<script setup lang="ts">
import { ThemeSwitcher } from "@/features/theme-switcher";

import { getBuildInfo, isDefined } from "@/shared/utils";

const buildInfo = getBuildInfo();

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="container flex items-center justify-between">
    <div>
      <span> © 2023 - {{ currentYear }} ReMoodle </span>
      <span v-if="isDefined(buildInfo)">
        Version: {{ buildInfo.version }}
      </span>
    </div>
    <ThemeSwitcher />
  </footer>
  <!-- <div></div> -->
</template>

<style scoped></style>
