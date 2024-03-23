<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useUserStore } from "@/shared/stores/user";
import { RouterNav } from "@/shared/ui/router-nav";
import { Link } from "@/shared/ui/link";
import { createAsyncProcess, isDefined } from "@/shared/utils";
import { RouteName } from "@/shared/types";
import type { Course } from "@/shared/types";
import { api } from "@/shared/api";

const route = useRoute();

const courseId = computed(() => route.params.courseId as string);

const course = ref<Course>();

const updateCourse = (data: Course | undefined) => {
  course.value = data;
};

const {
  run: fetchCourse,
  loading,
  error,
} = createAsyncProcess(async (id: string, signal: AbortSignal) => {
  updateCourse(undefined);

  const [data, error] = await api.getCourseContent(id, signal);

  if (error) {
    throw error;
  }

  updateCourse(data);
});

const abortController = new AbortController();

const signal = abortController.signal;

onMounted(async () => {
  await fetchCourse(courseId.value, signal);

  const hash = route.hash;

  setTimeout(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
      }
    }
  }, 100);
});

onBeforeUnmount(() => {
  abortController.abort();
});

const userStore = useUserStore();

const { preferences } = storeToRefs(userStore);
</script>

<template>
  <PageWrapper>
    <template #title>
      <h1>
        <template
          v-if="!route.query.courseName && loading && !isDefined(course)"
        >
          Loading...
        </template>
        <template v-else>
          {{ course?.name || (route.query.courseName as string) || "" }}
        </template>
      </h1>
    </template>
    <RoundedSection dense>
      <RouterNav>
        <Link :to="{ name: RouteName.Course }">Overview</Link>
        <Link
          :to="{ name: RouteName.Grades }"
          :force-exact-active="
            route.name === RouteName.Grades ||
            route.name === RouteName.Assignment
          "
        >
          Grades
        </Link>
      </RouterNav>
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <Component :is="Component" :content="course?.content" />
        </KeepAlive>
      </RouterView>
    </RoundedSection>
  </PageWrapper>
</template>
