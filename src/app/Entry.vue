<script setup lang="ts">
import { RouterView } from "vue-router";
import { Footer } from "@/widgets/footer";
import Toaster from "@/shared/ui/toast/Toaster.vue";
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
