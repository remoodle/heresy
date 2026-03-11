<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { watchEffect } from "vue";
import AuthDialog from "@/components/AuthDialog.vue";
import ExportToIcal from "@/components/ExportToIcal.vue";
import GroupSelect from "@/components/GroupSelect.vue";
import Schedule from "@/components/Schedule.vue";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useSchedule } from "@/composables/use-schedule";
import { useSessionQuery, useClearSession } from "@/lib/api/session";
import { authClient } from "@/lib/auth-client";
import { useAppStore } from "@/stores/app";

const appStore = useAppStore();
const { group, filters } = storeToRefs(appStore);

const { groupSchedule, allGroups, groupCourses } = useSchedule(
  () => group.value,
  () => filters.value,
);

const { data: session } = useSessionQuery();
const clearSession = useClearSession();

watchEffect(() => {
  if (allGroups.value && !allGroups.value.includes(group.value)) {
    group.value = "";
  }
});

function toggleCourse(course: string) {
  if (!group.value || !filters.value[group.value]) return;
  const f = filters.value[group.value]!;
  if (f.excludedCourses.includes(course)) {
    f.excludedCourses = f.excludedCourses.filter((c) => c !== course);
  } else {
    f.excludedCourses = [...f.excludedCourses, course];
  }
}

function isCourseIncluded(course: string): boolean {
  return (
    !!group.value &&
    !!filters.value[group.value] &&
    !filters.value[group.value]!.excludedCourses.includes(course)
  );
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="offcanvas" class="border-r-0">
      <SidebarHeader class="gap-3 p-3">
        <div class="flex items-center gap-2 px-1">
          <span class="text-sm font-semibold tracking-tight"
            >ReMoodle Calendar</span
          >
        </div>
        <GroupSelect v-model="group" :all-groups="allGroups || []" />
      </SidebarHeader>

      <SidebarContent>
        <template v-if="group && filters[group]">
          <SidebarGroup>
            <SidebarGroupLabel>Event Types</SidebarGroupLabel>
            <SidebarGroupContent>
              <div class="flex flex-col gap-1 px-1">
                <label
                  v-for="key in ['lecture', 'practice', 'learn'] as const"
                  :key="key"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border border-sidebar-border px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent"
                  @click.prevent="
                    filters[group]!.eventTypes[key] =
                      !filters[group]!.eventTypes[key]
                  "
                >
                  <div
                    class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors"
                    :class="
                      filters[group]!.eventTypes[key]
                        ? 'border-primary bg-primary'
                        : ''
                    "
                  >
                    <Icon
                      v-if="filters[group]!.eventTypes[key]"
                      icon="lucide:check"
                      class="size-3 text-primary-foreground"
                    />
                  </div>
                  <span class="leading-tight capitalize">{{ key }}</span>
                </label>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Event Formats</SidebarGroupLabel>
            <SidebarGroupContent>
              <div class="flex flex-col gap-1 px-1">
                <label
                  v-for="key in ['online', 'offline'] as const"
                  :key="key"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border border-sidebar-border px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent"
                  @click.prevent="
                    filters[group]!.eventFormats[key] =
                      !filters[group]!.eventFormats[key]
                  "
                >
                  <div
                    class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors"
                    :class="
                      filters[group]!.eventFormats[key]
                        ? 'border-primary bg-primary'
                        : ''
                    "
                  >
                    <Icon
                      v-if="filters[group]!.eventFormats[key]"
                      icon="lucide:check"
                      class="size-3 text-primary-foreground"
                    />
                  </div>
                  <span class="leading-tight capitalize">{{ key }}</span>
                </label>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Courses</SidebarGroupLabel>
            <SidebarGroupContent>
              <div class="flex flex-col gap-1 px-1">
                <label
                  v-for="course in groupCourses"
                  :key="course"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border border-sidebar-border px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent"
                  @click.prevent="toggleCourse(course)"
                >
                  <div
                    class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors"
                    :class="
                      isCourseIncluded(course)
                        ? 'border-primary bg-primary'
                        : ''
                    "
                  >
                    <Icon
                      v-if="isCourseIncluded(course)"
                      icon="lucide:check"
                      class="size-3 text-primary-foreground"
                    />
                  </div>
                  <span class="leading-tight">{{ course }}</span>
                </label>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </template>

        <div v-else class="px-2 py-6 text-center text-xs text-muted-foreground">
          Select a group to see filters
        </div>
      </SidebarContent>

      <SidebarFooter class="gap-3 p-3">
        <SidebarSeparator class="-mx-0" />
        <div class="flex flex-wrap items-center gap-2">
          <ThemeSwitcher />
          <a
            href="https://github.com/remoodle/heresy"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <Icon icon="mdi:github" class="h-4 w-4" />
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>

    <SidebarInset class="flex h-screen flex-col overflow-hidden">
      <header
        class="flex h-[41px] shrink-0 items-center justify-between border-b px-3 py-2"
      >
        <SidebarTrigger />
        <div class="flex items-center gap-2">
          <template v-if="group && filters && filters[group]">
            <ExportToIcal
              :events="groupSchedule"
              :group="group"
              :filters="filters[group]"
            />
          </template>

          <template v-if="!session?.data">
            <AuthDialog>
              <Button variant="ghost" size="sm" class="text-muted-foreground"
                >Sign in</Button
              >
            </AuthDialog>
          </template>
          <template v-else>
            <Button
              variant="ghost"
              size="sm"
              class="text-muted-foreground"
              @click="authClient.signOut().then(clearSession)"
            >
              Sign out
            </Button>
          </template>
        </div>
      </header>

      <div class="min-h-0 flex-1 overflow-hidden p-2">
        <Schedule
          class="h-full w-full"
          :events="groupSchedule"
          :theme="appStore.theme"
        />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
