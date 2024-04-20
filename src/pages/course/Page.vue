<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useUserStore } from "@/shared/stores/user";
import { RouterNav } from "@/shared/ui/router-nav";
import { Link } from "@/shared/ui/link";
import { api } from "@/shared/api";
import { createAsyncProcess, isDefined, insertIf } from "@/shared/utils";
import type { Course, Assignment } from "@/shared/types";
import { RouteName } from "@/shared/types";
import CourseOverview from "./CourseOverview.vue";
import CourseGrades from "./CourseGrades.vue";
import CourseAssignment from "./CourseAssignment.vue";

const route = useRoute();
const courseId = computed(() => route.params.courseId as string);
const assignmentId = computed(() => route.params.assignmentId as string);

const abortController = new AbortController();
const signal = abortController.signal;

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
const loadCourse = async () => {
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
};

const assignments = ref<Assignment[]>();
const updateAssignments = (data: Assignment[] | undefined) => {
  assignments.value = data;
};
const {
  run: fetchAssignments,
  loading: loadingAssignments,
  error: assignmentsError,
} = createAsyncProcess(async (id: string, signal: AbortSignal) => {
  updateAssignments(undefined);

  const [data, error] = await api.getCourseAssignments(id, signal);

  if (error) {
    throw error;
  }

  updateAssignments(data);
});
const loadAssignments = async () => {
  await fetchAssignments(courseId.value, signal);
};
const assignment = computed(() => {
  if (!assignmentId.value) {
    return undefined;
  }

  return assignments.value?.find(
    (a) => `${a.assignment_id}` === assignmentId.value,
  );
});

onMounted(async () => {
  await Promise.all([
    loadCourse(),
    ...insertIf(route.name === RouteName.Assignment, loadAssignments()),
  ]);
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
      <KeepAlive
        :include="['CourseOverview', 'CourseGrades', 'CourseAssignment']"
      >
        <template v-if="route.name === RouteName.Course">
          <CourseOverview
            :course-id="Number(courseId)"
            :content="course?.content"
          />
        </template>
        <template v-else-if="route.name === RouteName.Grades">
          <CourseGrades :course-id="courseId" :loading-course="loading" />
        </template>
        <template v-else-if="route.name === RouteName.Assignment">
          <CourseAssignment
            :assignment="assignment"
            :loading-assignments="loadingAssignments"
          />
        </template>
      </KeepAlive>
    </RoundedSection>
  </PageWrapper>
</template>
