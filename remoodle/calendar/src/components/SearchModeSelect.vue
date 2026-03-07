<script setup lang="ts">
import type { SearchMode } from "@/composables/use-schedule";
import { Button } from "@/components/ui/button";

defineProps<{
  modelValue: SearchMode;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SearchMode];
}>();

const modes: { value: SearchMode; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "location", label: "Location" },
  { value: "teacher", label: "Teacher" },
];
</script>

<template>
  <div class="flex rounded-lg border p-0.5" role="tablist">
    <Button
      v-for="m in modes"
      :key="m.value"
      :variant="modelValue === m.value ? 'secondary' : 'ghost'"
      size="sm"
      class="flex-1 rounded-md"
      @click="emit('update:modelValue', m.value)"
    >
      {{ m.label }}
    </Button>
  </div>
</template>
