<script setup lang="ts">
import type { Deadline } from "@/shared/types";
import { RouteName } from "@/shared/types";
import {
  splitCourseTitle,
  formatDate,
  fromUnix,
  getRelativeTime,
} from "@/shared/utils";
import { Link } from "@/shared/ui/link";

defineProps<{
  deadline: Deadline;
}>();

const formatDeadlineTitle = (title: string) => {
  return title.replace("is due", "").trim();
};
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <div class="flex flex-col">
      <Link to="/" hover class="truncate">
        {{ formatDeadlineTitle(deadline.name) }}
      </Link>
      <Link
        :to="{
          name: RouteName.Course,
          params: { id: deadline.course_id },
        }"
        hover
        class="truncate text-sm text-muted-foreground"
      >
        {{ splitCourseTitle(deadline.course_name).name }}
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
