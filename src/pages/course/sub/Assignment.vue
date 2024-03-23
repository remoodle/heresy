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
  <div>ass</div>
</template>
