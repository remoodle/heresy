<script setup lang="ts">
import { Label, type LabelProps } from "reka-ui";
import { cn } from "@/shared/ui/utils";

const props = defineProps<LabelProps & { class?: string }>();
</script>

<template>
  <Label
    v-bind="props"
    :class="
      cn(
        'text-foreground block text-left text-sm font-medium tracking-tight',
        props.class,
      )
    "
  >
    <slot />
  </Label>
</template>
