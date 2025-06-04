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
        'text-foreground text-lg leading-none font-semibold tracking-tight',
        props.class,
      )
    "
  >
    <slot />
  </DialogTitle>
</template>
