<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import { useUserStore } from "@/shared/stores/user";
import { RoundedSection, PageWrapper } from "@/entities/page";
import { Picture } from "@/shared/ui/picture";
import { RouteName } from "@/shared/types";
import AccountSidebar from "./ui/AccountSidebar.vue";
import AccountProfilePage from "./AccountProfile.vue";
import AccountNotificationsPage from "./AccountNotifications.vue";

import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";
import { api } from "@/shared/api";
import { useToast } from "@/shared/ui/toast";
import { createAsyncProcess } from "@/shared/utils";
import type { UserSettings } from "@/shared/types";

const userStore = useUserStore();

// const { loadSettings, loadingSettings, settings } = useAccountState();

const { toast } = useToast();

const settings = ref<UserSettings>();

const { run: loadSettings, loading: loadingSettings } = createAsyncProcess(
  async () => {
    const [data, error] = await api.getUserSettings();

    if (error) {
      toast({
        title: error.message,
      });
      throw error;
    }

    settings.value = data;
  },
);

onMounted(async () => {
  await loadSettings();
});
</script>

<template>
  <PageWrapper v-if="userStore.user && userStore.authorized">
    <template #title>
      <template v-if="settings">
        <div class="flex items-center gap-4">
          <Picture :name="settings.moodle_id" :size="56" />
          <div class="flex flex-col">
            {{ settings.name }}
            <span class="text-sm text-muted-foreground">
              {{ settings.username }}
            </span>
          </div>
        </div>
      </template>
    </template>
    <RoundedSection>
      <div
        class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0"
      >
        <aside class="-mx-4 lg:w-1/5">
          <AccountSidebar />
        </aside>
        <div class="flex-1">
          <div class="space-y-6" v-if="settings">
            <template v-if="$route.name === RouteName.AccountProfile">
              <AccountProfilePage :settings="settings" />
            </template>
            <template
              v-else-if="$route.name === RouteName.AccountNotifications"
            >
              <AccountNotificationsPage />
            </template>
          </div>
        </div>
      </div>
    </RoundedSection>
  </PageWrapper>
</template>
