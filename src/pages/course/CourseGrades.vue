<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useUserStore } from "@/shared/stores/user";
import { RouterNav } from "@/shared/ui/router-nav";
import { useToast } from "@/shared/ui/toast";
import { Link } from "@/shared/ui/link";
import { RouteName } from "@/shared/types";
import { createAsyncProcess, isDefined, splitCourseName } from "@/shared/utils";
import { api } from "@/shared/api";
import { type Grade } from "@/shared/types";

defineOptions({
  name: "CourseGrades",
});

const props = defineProps<{
  courseId: string;
  loadingCourse: boolean;
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
  {{ loadingCourse }}
  {{ grades }}
  <div v-if="grades">
    <li v-for="item in grades" :key="item.cmid">
      <Link
        :to="{
          name: RouteName.Assignment,
          params: { courseId: courseId, assignmentId: item.cmid },
        }"
      >
        Grades
      </Link>
    </li>
  </div>
  <!-- 
  <pre
    >{{ JSON.stringify(grades, null, 2) }}
  </pre> -->
</template>
