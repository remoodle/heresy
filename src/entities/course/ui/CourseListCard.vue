<script setup lang="ts">
import type { ActiveCourse } from "@/shared/types";
import { RouteName } from "@/shared/types";
import { splitCourseTitle } from "@/shared/utils";
import { Link } from "@/shared/ui/link";

defineProps<{
  course: ActiveCourse;
  showCategory: boolean;
}>();
</script>

<template>
  <Link
    :to="{ name: RouteName.Course, params: { id: course.course_id } }"
    class="flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
  >
    <div v-show="showCategory" class="text-xs text-muted-foreground">
      {{ course.coursecategory }}
    </div>
    <span class="text-lg font-medium">
      {{ splitCourseTitle(course.name).name }}
    </span>
    <div class="text-sm">
      {{ splitCourseTitle(course.name).teacher }}
    </div>
  </Link>
</template>
