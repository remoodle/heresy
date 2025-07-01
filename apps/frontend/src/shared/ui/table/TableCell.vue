<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/shared/ui/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <td
    data-slot="table-cell"
    :class="
      cn(
        'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
