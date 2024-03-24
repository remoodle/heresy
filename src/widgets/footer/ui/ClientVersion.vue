<script setup lang="ts">
import { Link } from "@/shared/ui/link";
import { isDefined } from "@/shared/utils";
import { WEB_CLIENT_REPO } from "@/shared/config";
import { getRepoURL, getBuildInfo } from "../lib";

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
