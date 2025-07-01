<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/shared/ui/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    data-slot="card-footer"
    :class="cn('[.border-t]:pt-6 flex items-center px-6', props.class)"
  >
    <slot />
  </div>
</template>
