<script setup lang="ts">
import { Link } from "@/shared/ui/link";
import { isDefined } from "@/shared/utils";
import { webClientRepo } from "@/shared/config";
import { getRepoURL, getBuildInfo } from "../lib";

const buildInfo = getBuildInfo() ?? {
  version: "0",
};
</script>

<template>
  <span>
    <Link :to="getRepoURL(webClientRepo)" underline hover>{{
      webClientRepo
    }}</Link>
    <span v-if="isDefined(buildInfo)"> v{{ buildInfo.version }} </span>
  </span>
</template>
