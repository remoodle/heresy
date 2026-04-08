<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { watch } from "vue";
import { useRouter } from "vue-router";
import AuthDialog from "@/components/AuthDialog.vue";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useSessionQuery } from "@/lib/api/session";

const router = useRouter();
const { data: session, isLoading } = useSessionQuery();

watch(session, (s) => {
  if (s?.data) router.replace("/schedule");
});
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4"
  >
    <main class="w-full max-w-sm">
      <div class="flex flex-col items-center gap-5 text-center">
        <p
          class="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase"
        >
          ReMoodle Calendar
        </p>
        <h1 class="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Sign in to your schedule
        </h1>
        <p class="max-w-xs text-sm leading-6 text-muted-foreground">
          Access your class schedule with your university account.
        </p>

        <AuthDialog v-if="!isLoading">
          <Button size="lg" class="min-w-36 rounded-full px-8">
            Sign in
          </Button>
        </AuthDialog>

        <div class="flex items-center gap-3 pt-2">
          <ThemeSwitcher />
          <a
            href="https://github.com/remoodle/heresy"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Icon icon="mdi:github" class="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  </div>
</template>
