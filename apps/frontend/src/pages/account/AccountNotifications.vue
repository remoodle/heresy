<script setup lang="ts">
import { ref, computed, toRaw, watch, watchEffect } from "vue";
import { useMutation, useQuery } from "@tanstack/vue-query";
import { objectEntries } from "@remoodle/utils";
import type { UserSettings } from "@remoodle/types";
import { Checkbox } from "@/shared/ui/checkbox";
import { Separator } from "@/shared/ui/separator";
import { useToast } from "@/shared/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";
import { useUserStore } from "@/shared/stores/user";
import {
  NOTIFICATIONS_CONFIG,
  NOTIFICATION_SETTING_STATE,
  TRANSPORT_TYPES,
} from "./lib";
import ConnectTelegram from "./ui/ConnectTelegram.vue";
import NotificationCheckbox from "./ui/NotificationCheckbox.vue";

const { data: account, suspense } = useQuery({
  queryKey: ["private", "user", "settings"],
  queryFn: async () =>
    await requestUnwrap((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders() }),
    ),
});

const { toast } = useToast();

const userStore = useUserStore();

const settings = ref<UserSettings>();

watchEffect(() => {
  if (account.value) {
    settings.value = structuredClone(toRaw(account.value.settings));
  }
});

const { mutate: updateNotifications, isPending: updatingNotifications } =
  useMutation({
    mutationFn: async (settings: UserSettings) =>
      requestUnwrap((client) =>
        client.v2.user.settings.$post(
          { json: { settings } },
          { headers: getAuthHeaders() },
        ),
      ),
    onError: (error) => {
      toast({
        title: error.message,
      });
    },
  });

watch(
  settings,
  (value) => {
    if (value) {
      updateNotifications(value);
    }
  },
  { deep: true },
);

const isDeadlinesEnabled = computed(() => {
  if (!settings.value?.notifications) {
    return false;
  }

  return (
    settings.value.notifications["deadlineReminders::telegram"] !==
    NOTIFICATION_SETTING_STATE.disabled
  );
});

const notificationGroups = computed(() => {
  if (!settings.value?.notifications) {
    return {};
  }

  const groups: Record<
    string,
    Record<string, { key: string; value: number }>
  > = {};

  for (const [key, value] of objectEntries(settings.value.notifications)) {
    const [name, transport] = key.split("::");
    if (!groups[name]) {
      groups[name] = {};
    }
    groups[name][transport] = { key, value };
  }

  return groups;
});

const AVAILABLE_THRESHOLDS = ["1h", "3h", "6h", "12h", "1d", "2d", "3d", "4d"];

await Promise.all([suspense(), userStore.suspense()]);
</script>

<template>
  <section v-if="account && settings" class="max-w-full space-y-6 md:max-w-2xl">
    <div>
      <h1 class="text-xl font-medium">Notifications</h1>
      <p class="text-muted-foreground text-sm">
        Configure how you receive notifications
      </p>
    </div>

    <Separator />

    <Table>
      <TableHeader class="[&_tr]:border-none">
        <TableRow class="hover:bg-transparent">
          <TableHead class="text-foreground !pl-0 text-base font-normal">
            Settings
          </TableHead>
          <template v-for="type in TRANSPORT_TYPES" :key="type">
            <TableHead class="w-14 text-center md:w-32">
              <p class="text-muted-foreground font-medium">
                <span class="capitalize">
                  {{ type }}
                </span>
              </p>
            </TableHead>
          </template>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-for="(transports, name) in notificationGroups" :key="name">
          <TableRow class="border-none">
            <TableCell class="px-0 py-4">
              {{
                name in NOTIFICATIONS_CONFIG
                  ? NOTIFICATIONS_CONFIG[
                      name as keyof typeof NOTIFICATIONS_CONFIG
                    ].title
                  : name
              }}
            </TableCell>
            <TableCell
              v-for="type in TRANSPORT_TYPES"
              :key="type"
              class="text-center"
            >
              <NotificationCheckbox
                :notification="transports[type]?.key"
                :value="transports[type]?.value"
                :disabled="!account.telegramId || updatingNotifications"
                @update="(key, value) => (settings!.notifications[key] = value)"
              />
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <div class="flex flex-col gap-4">
      <h2>
        Deadline thresholds
        <em v-if="!isDeadlinesEnabled" class="text-muted-foreground text-sm"
          >(enable {{ NOTIFICATIONS_CONFIG["deadlineReminders"].title }} for it
          to make sense)
        </em>
      </h2>
      <div
        class="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-6 md:gap-y-4"
      >
        <template v-for="threshold in AVAILABLE_THRESHOLDS" :key="threshold">
          <div class="flex flex-col gap-4">
            <div class="flex items-center space-x-2">
              <Checkbox
                :id="threshold"
                :model-value="
                  account.telegramId
                    ? settings.deadlineReminders.thresholds.includes(threshold)
                    : false
                "
                :disabled="
                  !account.telegramId ||
                  updatingNotifications ||
                  !isDeadlinesEnabled
                "
                @update:model-value="
                  (value) =>
                    (settings!.deadlineReminders.thresholds = value
                      ? [...settings!.deadlineReminders.thresholds, threshold]
                      : settings!.deadlineReminders.thresholds.filter(
                          (t) => t !== threshold,
                        ))
                "
              />
              <label
                :for="threshold"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {{ threshold }}
              </label>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="flex flex-col">
      <h2>Connections</h2>
      <ul class="flex flex-col">
        <ConnectTelegram :telegram-id="account.telegramId" />
      </ul>
    </div>
  </section>
</template>
