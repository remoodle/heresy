<script setup lang="ts">
import { onMounted } from "vue";

onMounted(async () => {
  const { pathname, search } = window.location;
  try {
    // Fetch the callback URL so the worker processes it (sets session cookie)
    await fetch(pathname + search, { credentials: "include" });
  } catch {
    // ignore — session may still be set
  }
  window.location.replace("/");
});
</script>

<template>
  <div />
</template>
