<script setup lang="ts">
import { RoundedSection, PageWrapper } from "@/entities/page";
import CoursesList from "./ui/CoursesList.vue";
import DeadlinesList from "./ui/DeadlinesList.vue";
</script>

<template>
  <PageWrapper>
    <template #title>
      <h1>Overview</h1>
    </template>
    <RoundedSection>
      <div
        class="flex flex-col-reverse justify-between gap-x-4 gap-y-6 lg:flex-row"
      >
        <div class="w-full lg:w-3/4">
          <CoursesList />
        </div>
        <hr />
        <div class="w-full flex-1 lg:w-1/4">
          <DeadlinesList />
        </div>
      </div>
    </RoundedSection>
  </PageWrapper>
</template>
