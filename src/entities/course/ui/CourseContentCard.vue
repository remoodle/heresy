<script setup lang="ts">
import type {
  CourseContent,
  CourseModule as ICourseModule,
} from "@/shared/types";
import CourseModule from "./CourseModule.vue";

const props = defineProps<{
  content: CourseContent;
  token: string;
}>();

const sortModules = (a: ICourseModule, b: ICourseModule) => {
  const aHasDescription = !!a.description;
  const bHasDescription = !!b.description;

  if (aHasDescription && !bHasDescription) {
    return 1;
  } else if (!aHasDescription && bHasDescription) {
    return -1;
  }

  return 0;
};
</script>

<template>
  <!-- <pre
    >{{ JSON.stringify(content, null, 2) }}
  </pre> -->
  <div
    v-show="content.visible === 1"
    class="space-y-5"
    :class="{ 'px-2 py-3': content.section === 0 }"
  >
    <a
      :id="`${content.id}`"
      :href="`#${content.id}`"
      :aria-label="`Permalink to ${content.name}`"
      tabindex="-1"
      class="group text-2xl text-primary"
      v-show="content.section !== 0"
    >
      {{ content.name }}
    </a>
    <p v-show="content.summary">
      {{ content.summary }}
    </p>
    <div
      class="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      <template
        v-for="item in [...content.modules].sort(sortModules)"
        :key="item.id"
      >
        <!-- {{ item }} -->
        <CourseModule :module="item" :token="token" />
      </template>
    </div>
  </div>
</template>
