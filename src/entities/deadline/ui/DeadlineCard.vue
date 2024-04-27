<script setup lang="ts">
import type { Deadline } from "@/shared/types";
import { RouteName } from "@/shared/types";
import {
  splitCourseName,
  formatAssignmentName,
  formatDate,
  fromUnix,
  getRelativeTime,
} from "@/shared/utils";
import { Link } from "@/shared/ui/link";

defineProps<{
  deadline: Deadline;
}>();
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <div class="flex flex-col">
      <component
        :is="deadline.assignment ? Link : 'span'"
        :to="{
          name: RouteName.Assignment,
          params: {
            courseId: deadline.course_id,
            assignmentId: deadline.assignment?.assignment_id,
          },
          query: {
            courseName: deadline.course_name,
          },
        }"
        hover
        class="truncate"
      >
        {{ formatAssignmentName(deadline.name) }}
      </component>
      <Link
        :to="{
          name: RouteName.Course,
          params: { courseId: deadline.course_id },
          query: {
            courseName: deadline.course_name,
          },
        }"
        hover
        class="truncate text-sm"
      >
        {{ splitCourseName(deadline.course_name).name }}
      </Link>
    </div>
    <span
      class="flex-shrink-0 text-sm"
      :title="formatDate(fromUnix(deadline.timestart), 'full')"
    >
      {{ getRelativeTime(fromUnix(deadline.timestart)) }}
    </span>
  </div>
</template>
