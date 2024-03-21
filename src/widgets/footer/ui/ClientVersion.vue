<script setup lang="ts">
import { getBuildInfo, getRepoURL, isDefined } from "@/shared/utils";
import { WEB_CLIENT_REPO } from "@/shared/config";
import { Link } from "@/shared/ui/link";

const buildInfo = getBuildInfo() ?? {
  version: "0",
};
</script>

<template>
  <span>
    <Link :to="getRepoURL(WEB_CLIENT_REPO)" underline hover>{{
      WEB_CLIENT_REPO
    }}</Link>
    <span v-if="isDefined(buildInfo)"> v{{ buildInfo.version }} </span>
  </span>
</template>
