<script setup lang="ts">
defineProps<{
  version: string;
}>();
</script>

<template>
  <span> v{{ version }} </span>
</template>
