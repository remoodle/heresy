<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-vue-next";

const appStore = useAppStore();

const toggleTheme = () => {
  appStore.toggleTheme();
};
</script>

<template>
  <slot :toggle-theme="toggleTheme" :theme="appStore.theme">
    <Button variant="secondary" size="icon" @click="toggleTheme" style="cursor: pointer">
      <Sun v-if="appStore.theme === 'light'" class="h-6 w-6" />
      <Moon v-else class="h-6 w-6" />
    </Button>
  </slot>
</template>
