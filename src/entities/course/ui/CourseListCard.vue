<script setup lang="ts">
import { computed } from "vue";
import type { ExtendedCourse } from "@/shared/types";
import { RouteName } from "@/shared/types";
import { splitCourseName } from "@/shared/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Link } from "@/shared/ui/link";
import { Icon } from "@/shared/ui/icon";

const props = defineProps<{
  course: ExtendedCourse;
  showCategory: boolean;
}>();

const splitted = computed(() => {
  return splitCourseName(props.course.name);
});

const attendance = computed(() => {
  return props.course.grades?.find((g) => g.itemmodule === "attendance");
});
</script>

<template>
  <Link
    :to="{
      name: RouteName.Course,
      params: { courseId: course.course_id },
      query: { courseName: course.name },
    }"
    class="flex items-center justify-between rounded-lg border p-3 text-left transition-all hover:bg-secondary"
  >
    <div class="flex flex-col">
      <div v-show="showCategory" class="text-xs text-muted-foreground">
        {{ course.coursecategory }}
      </div>
      <span class="text-lg font-medium">
        {{ splitted.name }}
      </span>
      <div class="text-sm text-muted-foreground">
        {{ splitted.teacher }}
      </div>
    </div>
    <div v-if="course.grades" class="flex gap-1">
      <TooltipProvider v-if="attendance?.percentage">
        <Tooltip>
          <TooltipTrigger>
            <div class="flex items-center gap-2 rounded-md border p-2">
              <Icon name="people" class="h-5 w-5" />
              {{ attendance.percentage }}%
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Attendance</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </Link>
</template>
