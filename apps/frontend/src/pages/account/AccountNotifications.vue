<script setup lang="ts">
import { ref, computed, toRaw, watch, watchEffect } from "vue";
import { useQueryClient, useMutation, useQuery } from "@tanstack/vue-query";
import { objectEntries } from "@remoodle/utils";
import type { UserSettings } from "@remoodle/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { Checkbox } from "@/shared/ui/checkbox";
import { Separator } from "@/shared/ui/separator";
import { useToast } from "@/shared/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
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
import { TELEGRAM_BOT_URL } from "@/shared/config";
import {
  NOTIFICATIONS_CONFIG,
  NOTIFICATION_SETTING_STATE,
  TRANSPORT_TYPES,
} from "./lib";
import NotificationCheckbox from "./ui/NotificationCheckbox.vue";

const { data: account, suspense } = useQuery({
  queryKey: ["private", "user", "settings"],
  queryFn: async () =>
    await requestUnwrap((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders() }),
    ),
});

const queryClient = useQueryClient();

const { toast } = useToast();

const userStore = useUserStore();

const settings = ref<UserSettings>();

watchEffect(() => {
  if (account.value) {
    settings.value = structuredClone(toRaw(account.value.settings));
  }
});

const otp = ref<string>("");
const showOtpModal = ref(false);

const connect = () => {
  setTimeout(() => {
    window.open(`${TELEGRAM_BOT_URL}?start=connect`, "_blank");
  }, 1000);
};

const { mutate: verifyOtp, isPending: verifying } = useMutation({
  mutationFn: async () =>
    requestUnwrap((client) =>
      client.v2.otp.verify.$post(
        { json: { otp: otp.value } },
        { headers: getAuthHeaders() },
      ),
    ),
  onSuccess: (data) => {
    showOtpModal.value = false;
    otp.value = "";

    queryClient.setQueryData(
      ["private", "user", "settings"],
      (old: Record<string, unknown>) => {
        return {
          ...old,
          telegramId: data.telegramId,
        };
      },
    );

    userStore.closeTelegramBanner();

    toast({
      title: "Telegram connected",
    });
  },
  onError: (error) => {
    toast({
      title: error.message,
    });
  },
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

const AVAILABLE_THRESHOLDS = [
  "1 hour",
  "3 hours",
  "6 hours",
  "12 hours",
  "1 day",
  "2 days",
  "3 days",
  "4 days",
];

await Promise.all([suspense(), userStore.suspense()]);

const isDeadlinesEnabled = computed(() => {
  if (!settings.value?.notifications) {
    return false;
  }

  return (
    settings.value.notifications["deadlineReminders::telegram"] !==
    NOTIFICATION_SETTING_STATE.disabled
  );
});
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
        <template
          v-for="{ key, name } in objectEntries(settings.notifications).map(
            ([key, value]) => {
              const [name, transport] = key.split('::');

              return {
                key,
                name,
                transport,
                value,
              };
            },
          )"
          :key="name"
        >
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
                :notification="key"
                :value="settings.notifications[key]"
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
          to make sense )
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
      <h2>Connected accounts</h2>
      <ul class="flex flex-col">
        <li
          class="bg-background divide divide-border flex w-full flex-wrap items-center justify-between gap-2 rounded-lg py-2"
        >
          <div class="flex items-center gap-2">
            <Icon name="telegram_logo" class="size-8" />
            <div class="flex flex-col">
              <p>Telegram</p>
              <p class="text-muted-foreground text-xs">
                Primary source {{ account.telegramId }}
              </p>
            </div>
          </div>
          <Dialog v-model:open="showOtpModal">
            <DialogTrigger as-child>
              <Button
                size="sm"
                :variant="account.telegramId ? 'outline' : 'default'"
                @click="connect"
              >
                {{ account.telegramId ? "Change" : "Connect" }}
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enter OTP </DialogTitle>
                <DialogDescription>
                  It was sent to your Telegram account
                </DialogDescription>
              </DialogHeader>

              <form @submit.prevent="verifyOtp()">
                <div class="flex max-w-sm items-center gap-2">
                  <Input
                    v-model="otp"
                    :disabled="verifying"
                    placeholder="Telegram OTP"
                  />
                  <Button type="submit" :disabled="verifying"> Verify </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </div>
  </section>
</template>
