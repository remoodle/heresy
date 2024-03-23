<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useUserStore } from "@/shared/stores/user";
import { RouterNav } from "@/shared/ui/router-nav";
import { useToast } from "@/shared/ui/toast";
import { Link } from "@/shared/ui/link";
import { createAsyncProcess, isDefined, splitCourseName } from "@/shared/utils";
import { api } from "@/shared/api";
import { type CourseContent, RouteName, type Grade } from "@/shared/types";

const route = useRoute();
const router = useRouter();

const props = defineProps<{
  courseId: string;
}>();

// const courseId = computed(() => route.params.courseId as string);

const grades = ref<Grade[]>();

const { toast } = useToast();

const updateGrade = (data: Grade[] | undefined) => {
  grades.value = data;
};

const {
  run: fetchGrades,
  loading,
  error,
} = createAsyncProcess(async (id: string) => {
  // updateGrade(undefined);

  const [data, error] = await api.getCourseGrades(id);

  if (error) {
    throw error;
  }

  updateGrade(data);
});

// watchEffect(async (onCleanup) => {
//   const abortController = new AbortController();

//   const signal = abortController.signal;

//   await fetchGrades(courseId.value, signal);

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

  await fetchGrades(props.courseId);

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
</script>

<template>
  <!-- <div>grades</div> -->
  <pre
    >{{ JSON.stringify(grades, null, 2) }}
  </pre>
</template>

<style scoped></style>
