<script setup lang="ts">
import { RouterView } from "vue-router";
import { getBuildInfo, isDefined } from "@/shared/lib/utils";
import Toaster from "@/shared/ui/toast/Toaster.vue";

const buildInfo = getBuildInfo();
</script>

<template>
  <div class="flex min-h-[100svh] flex-col">
    <div class="top-0 sticky">
      <div
        class="flex h-16 w-full justify-center bg-base-200 text-base-content shadow-sm transition-all duration-100"
      >
        ReMoodle
      </div>
    </div>
    <div class="my-10">
      <div class="-my-10 overflow-x-hidden bg-white">
        <RouterView />
      </div>
    </div>
    <footer>
      <span v-if="isDefined(buildInfo)">
        Version: {{ buildInfo.version }}
      </span>
    </footer>
  </div>
  <Toaster />
</template>
