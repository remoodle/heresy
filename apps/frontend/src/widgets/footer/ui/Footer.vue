<script setup lang="ts">
import { Link } from "@/shared/ui/link";
import { MonoLogo } from "@/shared/ui/logo";
import { RouteName } from "@/shared/lib/routes";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";
import {
  TELEGRAM_CHAT_URL,
  TELEGRAM_BOT_URL,
  GITHUB_REPO_URL,
  MODE,
  DONATE_URL,
} from "@/shared/config";
import ClientVersion from "./ClientVersion.vue";

withDefaults(
  defineProps<{
    slim?: boolean;
  }>(),
  {
    slim: false,
  },
);

const buildInfo = __BUILD_INFO__ ?? {
  version: "0",
};
</script>

<template>
  <div class="container" :class="[slim ? 'py-6' : 'py-6']">
    <div
      class="w-fit"
      :class="{
        'm-auto': slim,
        'w-full border-t py-6': !slim,
      }"
    >
      <div v-if="!slim" class="mb-4">
        <Link :to="{ name: RouteName.Home }" hover>
          <MonoLogo />
        </Link>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex justify-between gap-12">
          <div class="flex items-center gap-3">
            <div class="flex flex-col items-center justify-center gap-0.5">
              <Button
                variant="secondary"
                size="icon"
                :as="Link"
                :to="TELEGRAM_CHAT_URL"
              >
                <Icon class="h-6 w-6" name="telegram" />
              </Button>
              <span class="text-muted-foreground text-xs"> chat </span>
            </div>

            <div class="flex flex-col items-center justify-center gap-0.5">
              <Button
                variant="secondary"
                size="icon"
                :as="Link"
                :to="TELEGRAM_BOT_URL"
              >
                <Icon class="h-6 w-6" name="telegram" />
              </Button>
              <span class="text-muted-foreground text-xs"> bot </span>
            </div>

            <div class="flex flex-col items-center justify-center gap-0.5">
              <Button
                variant="secondary"
                size="icon"
                :as="Link"
                :to="DONATE_URL"
              >
                <Icon class="h-6 w-6" name="telegram" />
              </Button>
              <span class="text-muted-foreground text-xs"> donate </span>
            </div>

            <div class="flex flex-col items-center justify-center gap-0.5">
              <Button
                variant="secondary"
                size="icon"
                :as="Link"
                :to="GITHUB_REPO_URL"
              >
                <Icon class="h-6 w-6" name="github" />
              </Button>
              <span class="text-muted-foreground text-xs"> ⭐ </span>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center gap-0.5">
            <ThemeSwitcher class="flex-none" />
            <span class="text-muted-foreground text-xs"> theme </span>
          </div>
        </div>

        <span class="text-muted-foreground text-xs">
          <ClientVersion :version="buildInfo.version" />
          {{ MODE }}
        </span>
      </div>
    </div>
  </div>
</template>
