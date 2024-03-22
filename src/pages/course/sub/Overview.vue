<script setup lang="ts">
import type { CourseContent } from "@/shared/types";

defineProps<{
  content?: CourseContent[];
}>();
</script>

<template>
  <div>
    {{ content }}
  </div>
</template>

<style scoped></style>
