<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RoundedSection, PageWrapper, Error } from "@/entities/page";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Link } from "@/shared/ui/link";
import { RouteName } from "@/shared/types";
import type { ActiveCourses } from "@/shared/types";
import { api } from "@/shared/api";
import { createAsyncProcess, isDefined } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

const userStore = useUserStore();

const activeCourses = ref<ActiveCourses>();

const { run, loading, error } = createAsyncProcess(async () => {
  // const res = await api.get("/user");
  // userStore.setUser(res.data);

  const [data, error] = await api.getActiveCourses();

  if (error) {
    throw error;
  }

  activeCourses.value = data;
});

onMounted(async () => {
  await run();
});
</script>

<template>
  <template v-if="error">
    <div class="my-10">
      <Error @retry="run" />
    </div>
  </template>
  <template v-else-if="isDefined(activeCourses)">
    <div v-for="course in activeCourses" :key="course.course_id">
      <Link :to="{ name: RouteName.Course, params: { id: course.course_id } }">
        <Badge>{{ course.course_id }}</Badge>
      </Link>
      {{ course.name }}
    </div>
    <!-- {{ activeCourses }} -->
  </template>

  <!-- <PageWrapper>
    <template #title>
      <span> Dashboard </span>
    </template>
    <template v-if="error">
      <div class="my-10">
        <Error @retry="run" />
      </div>
    </template>
    <RoundedSection v-if="!error && isDefined(activeCourses)">
      123123
      <RouterNav>
        <Link
          data-testid="profile-details-in-setting"
          :to="{ name: 'settings' }"
        >
        1
        </Link>
        <Link
          data-testid="security-section-in-setting"
          :to="{ name: 'settings-security' }"
        >
2
      </Link>
      </RouterNav>
      <main class="my-8 w-full space-y-10 xl:w-4/5 2xl:w-2/3">
        <RouterView />
      </main>
    </RoundedSection>
  </PageWrapper> -->
</template>
