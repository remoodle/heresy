<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useUserStore } from "@/shared/stores/user";
import { RouterNav } from "@/shared/ui/router-nav";
import { useToast } from "@/shared/ui/toast";
import { Link } from "@/shared/ui/link";
import { createAsyncProcess, isDefined, splitCourseName } from "@/shared/utils";
import { api } from "@/shared/api";
import { type CourseContent, RouteName, type Course } from "@/shared/types";

const route = useRoute();
const router = useRouter();

const courseId = computed(() => route.params.courseId as string);

const course = ref<Course>();

const { toast } = useToast();

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

// watchEffect(async (onCleanup) => {
//   const abortController = new AbortController();

//   const signal = abortController.signal;

//   await fetchCourse(courseId.value, signal);

//   await router.replace({
//     query: {
//       ...router.currentRoute.value.query,
//       courseName: undefined,
//     },
//   });

//   onCleanup(() => {
//     abortController.abort();
//   });
// });

const abortController = new AbortController();

const signal = abortController.signal;

onMounted(async () => {
  // watchEffect(async (onCleanup) => {

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

  // await router.replace({
  //   query: {
  //     ...router.currentRoute.value.query,
  //     courseName: undefined,
  //   },
  // });

  // onCleanup(() => {
  //   abortController.abort();
  // });
  // });
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
      <!-- {{ course }} -->
    </RoundedSection>
  </PageWrapper>
</template>
