<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatAssignmentName } from "@/shared/utils";

const route = useRoute();
const router = useRouter();

const assignmentName = ref("");

onMounted(async () => {
  // console.log("13");
  // assignmentName.value = (route.query.assignmentName as string) || "";
  // await router.replace({
  //   query: {
  //     ...router.currentRoute.value.query,
  //     assignmentName: undefined,
  //   },
  // });
});
</script>

<template>
  <div>
    ass
    <!-- {{
      formatAssignmentName(
        assignmentName || (route.query.assignmentName as string),
      )
    }} -->

    <!-- <template v-if="loading && route.query.courseName">
          {{ splitCourseName((route.query.courseName as string) || "").name }}
        </template>
        <template v-else-if="loading || !isDefined(course)">
          Loading...
        </template>
        <template v-else> {{ splitCourseName(course.name).name }} </template> -->
  </div>
</template>

<style scoped></style>
