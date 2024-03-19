<script setup lang="ts">
import { useAppStore } from "@/shared/stores/app";
import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";

const appStore = useAppStore();
</script>

<template>
  <Button variant="secondary" size="icon" @click="appStore.toggleTheme()">
    <Icon class="h-6 w-6" :name="appStore.theme === 'light' ? 'sun' : 'moon'" />
  </Button>
</template>
