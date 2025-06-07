<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useQuery } from "@tanstack/vue-query";
import type {
  ExtendedCourse,
  MoodleCourseClassification,
} from "@remoodle/types";
import { Error } from "@/entities/page";
import { CourseListCard } from "@/entities/course";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { Skeleton } from "@/shared/ui/skeleton";
import { isDefined, partition } from "@/shared/lib/helpers";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";

const toggledCourseCategories = ref<string[]>([]);

const courses = ref<{
  [category: string]: ExtendedCourse[] | undefined;
}>();

const courseCategories = computed(() => Object.keys(courses.value || {}));

const classification = ref<MoodleCourseClassification>("inprogress");

const { isFetching, isError, data, error, refetch } = useQuery({
  queryKey: ["private", "courses.overall", classification],
  queryFn: async () =>
    await requestUnwrap((client) =>
      client.v2.courses.overall.$get(
        { query: { status: classification.value } },
        { headers: getAuthHeaders() },
      ),
    ),
});

watchEffect(() => {
  if (!data.value) {
    return;
  }

  courses.value = partition(data.value, ({ coursecategory }) => coursecategory);

  if (courseCategories.value.length && !toggledCourseCategories.value.length) {
    toggledCourseCategories.value.push(...courseCategories.value);
  }
});
</script>

<template>
  <template v-if="isFetching">
    <div class="space-y-3">
      <div class="flex gap-2">
        <Skeleton class="h-9 w-24" />
        <Skeleton class="h-9 w-24" />
      </div>
      <div class="flex flex-col gap-3">
        <Skeleton v-for="i in 5" :key="i" class="h-20 w-full" />
      </div>
    </div>
  </template>
  <template v-else-if="error || !isDefined(courses)">
    <Error @retry="refetch" />
  </template>
  <template v-else>
    <template v-if="courseCategories.length">
      <ToggleGroup
        v-model="toggledCourseCategories"
        class="flex flex-wrap items-start justify-start"
        type="multiple"
        variant="primary"
      >
        <ToggleGroupItem
          v-for="category in courseCategories"
          :key="category"
          :value="category"
          :aria-label="`Toggle ${category}`"
        >
          {{ category }}
        </ToggleGroupItem>
      </ToggleGroup>
      <div class="py-2" />
    </template>
    <div class="flex flex-col gap-3">
      <CourseListCard
        v-for="course in toggledCourseCategories
          .filter(Boolean)
          .flatMap((category) => (courses && courses[category]) || [])"
        :key="course.id"
        :course="course"
        :show-category="toggledCourseCategories.length > 1"
      />
    </div>
  </template>
</template>
