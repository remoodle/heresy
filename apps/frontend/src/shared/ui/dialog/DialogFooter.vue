<script setup lang="ts">
import { cn } from "@/shared/ui/utils";

interface DialogFooterProps {
  class?: string;
}

const props = defineProps<DialogFooterProps>();
</script>

<template>
  <div
    :class="
      cn(
        'mt-1.5 flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
