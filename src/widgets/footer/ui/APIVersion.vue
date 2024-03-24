<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { getURLHost } from "@/shared/utils";

const props = defineProps<{ host: string }>();

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

watchEffect(async () => {
  status.value = await pingServer(props.host);
});
</script>

<template>
  <span v-if="status">
    <template v-if="status.available">
      {{ getURLHost(host) }}
      <span class="break-all"> v{{ status.versionTag }} </span>
    </template>
    <template v-else>Server is not responding</template>
  </span>
</template>
