<script setup lang="ts">
import { SelectGroup, type SelectGroupProps } from "radix-vue";
import { cn } from "@/shared/utils";

const props = defineProps<SelectGroupProps & { class?: string }>();
</script>

<template>
  <SelectGroup :class="cn('w-full p-1', props.class)" v-bind="props">
    <slot />
  </SelectGroup>
</template>
