<script setup lang="ts">
import { CourseContentCard } from "@/entities/course";
import type { CourseContent } from "@/shared/types";
import { useUserStore } from "@/shared/stores/user";

defineProps<{
  content?: CourseContent[];
}>();

const userStore = useUserStore();

// TODO: Skeleton loading
</script>

<template>
  <div class="flex w-full flex-col gap-5" v-if="content">
    <template v-for="item in content" :key="item.id">
      <CourseContentCard :content="item" :token="userStore.token" />
      <hr />
    </template>
  </div>
</template>
