<script setup lang="ts">
import { RadioGroupRoot, useForwardPropsEmits } from "reka-ui";
import type { RadioGroupRootEmits, RadioGroupRootProps } from "reka-ui";
import { computed } from "vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/shared/ui/utils";

const props = defineProps<
  RadioGroupRootProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<RadioGroupRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <RadioGroupRoot
    :class="cn('flex flex-wrap items-center gap-2', props.class)"
    v-bind="forwarded"
  >
    <slot />
  </RadioGroupRoot>
</template>
