<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { useUserStore } from "@/shared/stores/user";

const userStore = useUserStore();

const { preferences } = storeToRefs(userStore);
</script>

<template>
  <PageWrapper>
    <template #title>
      <h1>Account</h1>
    </template>
    <RoundedSection> empty </RoundedSection>
  </PageWrapper>
</template>
