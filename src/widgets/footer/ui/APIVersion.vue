<script setup lang="ts">
import { onMounted, ref } from "vue";
import { API_URL, WEB_SERVICES_REPO } from "@/shared/config";
import { Link } from "@/shared/ui/link";
import { getRepoURL } from "@/shared/utils";

const status = ref<{
  available: boolean;
  versionTag: string;
}>();

const pingServer = async (url: string) => {
  try {
    const res = await fetch(`${url}/health`);

    return {
      available: res.ok,
      versionTag: res.headers.get("Version") || "",
    };
  } catch (e) {
    return { available: false, versionTag: "" };
  }
};

onMounted(async () => {
  status.value = await pingServer(API_URL);
});
</script>

<template>
  <span v-if="status">
    |
    <template v-if="status.available">
      <Link :to="getRepoURL(WEB_SERVICES_REPO)" underline hover>{{
        WEB_SERVICES_REPO
      }}</Link>
      <span class="break-all"> v{{ status.versionTag }} </span>
    </template>
    <template v-else>Server is not responding</template>
  </span>
</template>
