<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RoundedSection, PageWrapper, Error } from "@/entities/page";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Link } from "@/shared/ui/link";
import { RouteName } from "@/shared/types";
import type { ActiveCourse, ActiveCourses, Deadline } from "@/shared/types";
import { api } from "@/shared/api";
import { createAsyncProcess, isDefined, partition } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

const userStore = useUserStore();

const activeCourses = ref<ActiveCourses>();

// const courseCategories = ref<string[]>();
const activeCategory = ref<string>("");
const courses = ref<{
  [x: string]: ActiveCourse[] | undefined;
}>();

const deadlines = ref<Deadline[]>();

const { run, loading, error } = createAsyncProcess(async () => {
  // const res = await api.get("/user");
  // userStore.setUser(res.data);

  const [data, error] = await api.getActiveCourses();

  if (error) {
    throw error;
  }

  activeCourses.value = data;

  courses.value = partition(data, ({ coursecategory }) => coursecategory);
  activeCategory.value = Object.keys(courses.value)[0];
});

const { run: loadDeadlines, loading: loadingDeadlines } = createAsyncProcess(
  async () => {
    const [data, error] = await api.getDeadlines();

    if (error) {
      throw error;
    }

    deadlines.value = data;
  },
);

onMounted(async () => {
  await Promise.all([run(), loadDeadlines()]);
  // await run();
  // await loadDeadlines();
});
</script>

<template>
  <PageWrapper>
    <template #title>
      <span> Overview </span>
    </template>
    <template v-if="error">
      <div class="my-10">
        <Error @retry="run" />
      </div>
    </template>
    <RoundedSection
      v-if="!error && isDefined(activeCourses) && isDefined(courses)"
    >
      <div class="flex justify-between gap-4">
        <div class="w-3/4">
          <Button
            v-for="category in Object.keys(courses)"
            :key="category"
            :variant="category === activeCategory ? 'default' : 'ghost'"
            @click="activeCategory = category"
          >
            {{ category }}
          </Button>
          <br />
          <div
            v-for="course in courses[activeCategory]"
            :key="course.course_id"
          >
            <Link
              :to="{ name: RouteName.Course, params: { id: course.course_id } }"
            >
              <Badge>{{ course.course_id }}</Badge>
              {{ course.name }}
              {{ course }}
            </Link>
          </div>
        </div>
        <div class="w-1/4 flex-1">
          deadlines
          <br />
          {{ deadlines }}
        </div>
      </div>

      <main class="my-8 w-full space-y-3 xl:w-4/5 2xl:w-2/3">123</main>
    </RoundedSection>
  </PageWrapper>
</template>
