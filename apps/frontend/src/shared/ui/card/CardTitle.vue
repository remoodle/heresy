<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/shared/ui/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('font-semibold leading-none', props.class)"
  >
    <slot />
  </h3>
</template>
