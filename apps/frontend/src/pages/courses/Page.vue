<script setup lang="ts">
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useRouteQuery } from "@vueuse/router";
import { useQuery } from "@tanstack/vue-query";
import type { MoodleCourseClassification } from "@remoodle/types";
import { Error } from "@/entities/page";
import { CourseListCard } from "@/entities/course";
import { RadioCardGroup, RadioCardItem } from "@/shared/ui/radio-card-group";
import { Skeleton } from "@/shared/ui/skeleton";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";

const classification = useRouteQuery<MoodleCourseClassification>("c", "past");

const { isPending, isError, data, error, refetch } = useQuery({
  queryKey: ["private", "courses", classification],
  queryFn: async () =>
    await requestUnwrap((client) =>
      client.v2.courses.$get(
        { query: { status: classification.value } },
        { headers: getAuthHeaders() },
      ),
    ),
});
</script>

<template>
  <PageWrapper>
    <template #title>
      <h1>Courses</h1>
    </template>
    <RoundedSection>
      <div class="flex w-full flex-col gap-y-6 lg:w-3/4">
        <RadioCardGroup v-model="classification" :disabled="isPending">
          <RadioCardItem value="past"> Past </RadioCardItem>
          <RadioCardItem value="inprogress"> In progress </RadioCardItem>
        </RadioCardGroup>

        <template v-if="isPending">
          <div class="flex flex-col gap-3">
            <Skeleton v-for="i in 5" :key="i" class="h-20 w-full" />
          </div>
        </template>
        <template v-else-if="error">
          <Error @retry="refetch" />
        </template>
        <template v-else>
          <div class="flex flex-col gap-3">
            <CourseListCard
              v-for="course in data"
              :key="course.id"
              :course="course"
              :show-category="true"
            />
          </div>
        </template>
      </div>
    </RoundedSection>
  </PageWrapper>
</template>
