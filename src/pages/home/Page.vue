<script setup lang="ts">
import { Link } from "@/shared/ui/link";
import { routeTo } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

const userStore = useUserStore();
</script>

<template>
  <div v-if="!userStore.authorized">
    <Link :to="routeTo('login')">Login</Link>
  </div>
  hello
</template>

<style scoped></style>
