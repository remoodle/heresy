<script setup lang="ts">
import { useAppStore } from "@/shared/stores/app";
import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";

const appStore = useAppStore();
</script>

<template>
  <Button variant="secondary" @click="appStore.toggleTheme()">
    <Icon
      class="h-6 w-6 mr-2"
      :name="appStore.theme === 'light' ? 'sun' : 'moon'"
    />
    Change theme
  </Button>
</template>
