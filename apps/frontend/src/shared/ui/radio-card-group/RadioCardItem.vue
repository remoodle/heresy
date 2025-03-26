<script setup lang="ts">
import { Circle } from "lucide-vue-next";
import type { RadioGroupItemProps } from "reka-ui";
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from "reka-ui";
import { computed } from "vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/shared/ui/utils";

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'peer items-center justify-between rounded-xl border-2 border-muted bg-popover p-3 ring-offset-background hover:cursor-pointer hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary',
        props.class,
      )
    "
  >
    <slot></slot>
  </RadioGroupItem>
</template>
