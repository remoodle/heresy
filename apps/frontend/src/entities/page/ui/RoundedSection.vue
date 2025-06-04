<script setup lang="ts">
withDefaults(
  defineProps<{
    dense?: boolean;
  }>(),
  {
    dense: false,
  },
);
</script>

<template>
  <div class="bg-background rounded-t-md sm:rounded-t-[40px]">
    <div class="container" :class="[dense ? 'py-1' : 'py-5']">
      <slot> </slot>
    </div>
  </div>
</template>
