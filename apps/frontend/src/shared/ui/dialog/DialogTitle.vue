<script setup lang="ts">
import { DialogTitle, type DialogTitleProps } from "reka-ui";
import { cn } from "@/shared/ui/utils";

const props = defineProps<DialogTitleProps & { class?: string }>();
</script>

<template>
  <DialogTitle
    v-bind="props"
    :class="
      cn(
        'text-foreground text-lg font-semibold leading-none tracking-tight',
        props.class,
      )
    "
  >
    <slot />
  </DialogTitle>
</template>
