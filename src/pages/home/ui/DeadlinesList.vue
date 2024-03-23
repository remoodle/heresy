<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Error } from "@/entities/page";
import { DeadlineCard } from "@/entities/deadline";
import { Skeleton } from "@/shared/ui/skeleton";
import type { Deadline } from "@/shared/types";
import { api } from "@/shared/api";
import {
  createAsyncProcess,
  isDefined,
  partition,
  objectEntries,
  fromUnix,
  formatDate,
} from "@/shared/utils";

const deadlines = ref<{
  [date: string]: Deadline[] | undefined;
}>();

const test = [
  {
    event_id: 461532,
    timestart: 1711303200,
    instance: 104300,
    name: "Final Exam is due 12312312312312313121231312",
    visible: 1,
    course_id: 3919,
    course_name: "Computational Mathematics | Anar Rakhymzhanova",
  },
  {
    event_id: 123,
    timestart: 1711281600,
    instance: 104300,
    name: "Final Exam is due",
    visible: 1,
    course_id: 3919,
    course_name: "Computational Mathematics | Anar Rakhymzhanova",
  },
  {
    event_id: 123,
    timestart: 1711389600,
    instance: 104300,
    name: "Final Exam is due",
    visible: 1,
    course_id: 3919,
    course_name: "Computational Mathematics | Anar Rakhymzhanova",
  },
];

const { run, loading, error } = createAsyncProcess(async () => {
  const [data, error] = await api.getDeadlines();

  if (error) {
    throw error;
  }

  deadlines.value = partition(
    data,
    // test,
    ({ timestart }) => `${formatDate(fromUnix(timestart), "fullDate")}`,
  );
});

onMounted(run);
</script>

<template>
  <template v-if="loading">
    <div class="flex flex-col gap-2">
      <Skeleton v-for="i in 3" :key="i" class="h-16" />
    </div>
  </template>
  <template v-else-if="error || !isDefined(deadlines)">
    <Error @retry="run" />
  </template>
  <template v-else>
    <div class="flex flex-col gap-5">
      <div v-for="[date, list] in objectEntries(deadlines)" :key="date">
        <div class="mb-1 flex justify-between">
          <span class="text-lg font-medium">
            {{ date }}
          </span>
        </div>
        <div class="flex flex-col gap-1.5">
          <DeadlineCard
            v-for="deadline in list"
            :key="deadline.event_id"
            :deadline="deadline"
          />
        </div>
      </div>
    </div>
  </template>
</template>
