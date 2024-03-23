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
import { type Grade } from "@/shared/types";

const props = defineProps<{
  courseId: string;
}>();

const grades = ref<Grade[]>();

const updateGrade = (data: Grade[] | undefined) => {
  grades.value = data;
};

const {
  run: fetchGrades,
  loading,
  error,
} = createAsyncProcess(async (id: string) => {
  const [data, error] = await api.getCourseGrades(id);

  if (error) {
    throw error;
  }

  updateGrade(data);
});

onMounted(async () => {
  await fetchGrades(props.courseId);
});
</script>

<template>
  <pre
    >{{ JSON.stringify(grades, null, 2) }}
  </pre>
</template>

<style scoped></style>
