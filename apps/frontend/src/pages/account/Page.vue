<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useRoute } from "vue-router";
import { useUserStore } from "@/shared/stores/user";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";
import { Avatar } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";
import { RouteName } from "@/shared/lib/routes";
import AccountSidebar from "./ui/AccountSidebar.vue";
import AccountProfilePage from "./AccountProfile.vue";
import AccountNotificationsPage from "./AccountNotifications.vue";

const userStore = useUserStore();

const route = useRoute();
</script>

<template>
  <PageWrapper v-if="userStore.user && userStore.authorized">
    <template #title>
      <div class="flex items-center gap-4">
        <Avatar :name="userStore.user.handle" :size="56" />
        <div class="flex flex-col">
          {{ userStore.user.name }}
          <span class="text-muted-foreground text-sm">
            {{ userStore.user.handle }}
          </span>
        </div>
      </div>
    </template>
    <RoundedSection>
      <div
        class="flex flex-col space-x-2 space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0"
      >
        <aside class="lg:w-1/5">
          <AccountSidebar />
        </aside>
        <div class="flex-1">
          <template v-if="route.name === RouteName.AccountProfile">
            <Suspense>
              <AccountProfilePage />
              <template #fallback>
                <div>
                  <div class="flex flex-col gap-4">
                    <Skeleton class="h-12" />
                    <Skeleton class="h-6 w-1/2" />
                    <Skeleton class="h-6" />
                  </div>
                  <div class="py-6"></div>
                  <div class="flex flex-col gap-4">
                    <Skeleton class="h-12" />
                    <Skeleton class="h-6 w-1/3" />
                    <Skeleton class="h-6" />
                  </div>
                </div>
              </template>
            </Suspense>
          </template>
          <template v-else-if="route.name === RouteName.AccountNotifications">
            <Suspense>
              <AccountNotificationsPage />
              <template #fallback>
                <div class="flex flex-col gap-4">
                  <Skeleton class="h-12" />
                  <Skeleton class="h-12" />
                  <Skeleton class="h-12" />
                  <Skeleton class="h-12" />
                  <Skeleton class="h-6 w-1/3" />
                  <Skeleton class="h-6" />
                </div>
              </template>
            </Suspense>
          </template>
        </div>
      </div>
    </RoundedSection>
  </PageWrapper>
</template>
