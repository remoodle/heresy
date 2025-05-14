<script setup lang="ts">
import { useSettingsStore } from "@/shared/stores/settings";
import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";

const settingsStore = useSettingsStore();

const toggleTheme = () => {
  settingsStore.toggleTheme();
};
</script>

<template>
  <slot :toggle-theme="toggleTheme" :theme="settingsStore.theme">
    <Button variant="secondary" size="icon" @click="toggleTheme">
      <Icon
        class="h-6 w-6"
        :name="settingsStore.theme === 'light' ? 'sun' : 'moon'"
      />
    </Button>
  </slot>
</template>
