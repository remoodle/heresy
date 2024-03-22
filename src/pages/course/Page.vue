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
import { type CourseContent, RouteName } from "@/shared/types";

const route = useRoute();
const router = useRouter();

const courseId = computed(() => route.params.courseId as string);

const course = ref<{
  name: string;
  contents: CourseContent[];
}>();

const { toast } = useToast();

const updateCourse = (data: CourseContent[] | undefined) => {
  if (!data) {
    course.value = undefined;
    return;
  }

  course.value = {
    // name: "Introduction to SRE",
    // name: "Computational Mathematics",
    name: courseId.value,
    contents: data,
  };
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
      <div class="flex items-center">
        <div>
          <!-- {{ !route.query.courseName || loading }} -->
          <template
            v-if="!route.query.courseName && loading && !isDefined(course)"
          >
            Loading...
          </template>
          <template v-else>
            {{ course?.name || (route.query.courseName as string) || "" }}
            <!-- {{
            splitCourseName(course?.name || (route.query.courseName as string))
              ?.name
          }} -->
          </template>
          <!-- <template v-if="route.name === RouteName.Assignment">
          > {{ route.query.assignmentName }}
        </template> -->

          <!-- {{ $route.params.courseId }} -->
          <!-- {{ !loading }} -->

          <!-- <template v-if="route.query.courseName"> -->
          <!-- {{ splitCourseName((route.query.courseName as string) || "").name }} -->
          <!-- </template> -->
          <!-- <template v-else-if="loading || !isDefined(course)">
          Loading...
        </template>
        <template v-else> {{ splitCourseName(course.name).name }} </template> -->

          <!-- {{ splitCourseName((route.query.courseName as string) || "").name }} > -->
          <!-- {{ route.query.assignmentName }} -->
        </div>
        <!-- <template v-if="route.name === RouteName.Assignment">
          {{ route.query.assignmentName }}
        </template> -->
      </div>
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
          <Component :is="Component" :content="course?.contents" />
        </KeepAlive>
      </RouterView>
      <!-- {{ course }} -->
    </RoundedSection>
  </PageWrapper>
</template>
