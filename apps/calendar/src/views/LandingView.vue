<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthDialog from "@/components/AuthDialog.vue";
import DitherCalendar from "@/components/DitherCalendar.vue";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useSessionQuery } from "@/lib/api/session";

const route = useRoute();
const router = useRouter();
const { data: session, isLoading } = useSessionQuery();

const next = Array.isArray(route.query.next) ? route.query.next[0] : route.query.next;
const callbackURL = next || "/schedule";

watch(session, (currentSession) => {
  if (currentSession?.data) router.replace(callbackURL);
});
</script>

<template>
  <div class="landing-page">
    <header class="landing-header">
      <a href="/" class="landing-brand">
        <span class="landing-brand__mark" aria-hidden="true">
          <span />
          <span />
        </span>
        ReMoodle Calendar
      </a>

      <nav class="landing-nav" aria-label="Site links">
        <a
          href="https://github.com/remoodle/heresy"
          target="_blank"
          rel="noopener noreferrer"
          class="landing-link"
        >
          GitHub
          <Icon icon="mdi:arrow-top-right" aria-hidden="true" />
        </a>
        <ThemeSwitcher />
      </nav>
    </header>

    <main class="landing-main">
      <section class="landing-copy" aria-labelledby="landing-title">
        <h1 id="landing-title">Classes and deadlines in one calendar.</h1>
        <p>
          Your AITU timetable and Moodle deadlines, together. Export everything to the calendar you
          already use.
        </p>

        <div class="landing-action">
          <AuthDialog v-if="!isLoading" :callback-u-r-l="callbackURL">
            <Button>
              Sign in
              <Icon icon="mdi:arrow-right" aria-hidden="true" />
            </Button>
          </AuthDialog>
          <span v-else class="landing-loading" aria-live="polite">Checking your session…</span>
          <span class="landing-hint">Use your AITU Microsoft account</span>
        </div>
      </section>

      <div class="landing-illustration">
        <DitherCalendar />
      </div>
    </main>

    <footer class="landing-footer">
      <span>Made for AITU students</span>
      <span>Schedule · Moodle deadlines · iCal export</span>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  width: min(100% - 40px, 840px);
  margin-inline: auto;
  color: var(--foreground);
}

.landing-header {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.landing-brand,
.landing-link {
  color: inherit;
  text-decoration: none;
}

.landing-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.landing-brand__mark {
  position: relative;
  display: grid;
  width: 15px;
  height: 15px;
  grid-template-columns: repeat(2, 3px);
  grid-template-rows: repeat(2, 3px);
  place-content: center;
  gap: 2px;
  border: 1px solid currentColor;
}

.landing-brand__mark::before,
.landing-brand__mark::after {
  position: absolute;
  top: -3px;
  width: 1px;
  height: 4px;
  background: currentColor;
  content: "";
}

.landing-brand__mark::before {
  left: 3px;
}

.landing-brand__mark::after {
  right: 3px;
}

.landing-brand__mark span {
  width: 3px;
  height: 3px;
  background: currentColor;
  opacity: 0.45;
}

.landing-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.landing-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  text-underline-offset: 3px;
}

.landing-link:hover {
  color: var(--foreground);
  text-decoration: underline;
}

.landing-link svg {
  width: 14px;
  height: 14px;
}

.landing-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  align-items: center;
  gap: 64px;
  padding-block: 88px 82px;
}

.landing-copy h1 {
  max-width: 520px;
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.landing-copy > p {
  max-width: 450px;
  margin: 22px 0 0;
  color: var(--muted-foreground);
  font-size: 0.9375rem;
  line-height: 1.65;
}

.landing-action {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
}

.landing-hint,
.landing-loading {
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

.landing-illustration {
  display: flex;
  justify-content: center;
}

.landing-footer {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

@media (max-width: 700px) {
  .landing-main {
    grid-template-columns: 1fr;
    gap: 52px;
    padding-block: 64px 58px;
  }

  .landing-illustration {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .landing-page {
    width: min(100% - 32px, 840px);
  }

  .landing-header {
    min-height: 58px;
  }

  .landing-link {
    font-size: 0;
  }

  .landing-link svg {
    width: 17px;
    height: 17px;
  }

  .landing-main {
    gap: 42px;
    padding-block: 52px 48px;
  }

  .landing-action {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
  }

  .landing-footer {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding-block: 14px;
  }
}
</style>
