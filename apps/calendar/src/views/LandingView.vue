<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthDialog from "@/components/AuthDialog.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useSessionQuery } from "@/lib/api/session";

const route = useRoute();
const router = useRouter();
const { data: session, isLoading } = useSessionQuery();

const next = Array.isArray(route.query.next) ? route.query.next[0] : route.query.next;
const callbackURL = next || "/schedule";

watch(session, (s) => {
  if (s?.data) router.replace(callbackURL);
});
</script>

<template>
  <div class="relative flex min-h-svh flex-col overflow-hidden bg-background">
    <!-- Subtle radial gradient -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.3_0_0/0.25),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.9_0_0/0.07),transparent)]"
    />

    <!-- Nav -->
    <header class="relative flex justify-center px-6 pt-5">
      <div
        class="flex w-full max-w-xl items-center justify-between rounded-lg border border-border bg-secondary py-2 pr-2 pl-4 backdrop-blur dark:bg-muted/10"
      >
        <span class="text-sm font-semibold tracking-tight"> ReMoodle Calendar </span>
        <div class="flex items-center gap-2">
          <ThemeSwitcher />
          <Button variant="outline" size="sm" class="h-7 px-2.5 text-xs" as-child>
            <a href="https://github.com/remoodle/heresy" target="_blank" rel="noopener noreferrer">
              <Icon icon="mdi:github" class="h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <main
      class="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center"
    >
      <Badge variant="secondary">For AITU students</Badge>

      <h1 class="max-w-2xl text-5xl font-bold tracking-tight text-balance sm:text-6xl">
        Your university schedule,<br />actually useful
      </h1>

      <p class="max-w-md text-sm leading-relaxed text-muted-foreground">
        See your class schedule at a glance. Track deadlines from Moodle in one place. Export as
        iCal.
      </p>

      <div class="flex items-center gap-3 pt-2">
        <AuthDialog v-if="!isLoading" :callback-u-r-l="callbackURL">
          <Button size="lg"> Sign in with Microsoft </Button>
        </AuthDialog>
      </div>
    </main>
  </div>
</template>
