<script setup lang="ts">
import { ref, computed, toRaw, watch, watchEffect } from "vue";
import { useQueryClient, useMutation, useQuery } from "@tanstack/vue-query";
import { objectEntries } from "@remoodle/utils";
import type { UserSettings } from "@remoodle/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
  <section class="space-y-6">
    <div>
      <h1 class="text-xl font-medium">Notifications</h1>
      <p class="text-muted-foreground text-sm">
        Configure how you receive notifications
      </p>
    </div>

    <Separator />

    <section v-if="account && settings" class="max-w-2xl">
      <div class="flex flex-col">
        <h2>Settings</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead> </TableHead>
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
              <TableRow>
                <TableCell class="p-4">
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
                    @update="
                      (key, value) => (settings!.notifications[key] = value)
                    "
                  />
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>

      <div class="py-3" />

      <div class="flex flex-col gap-4">
        <h2>
          Deadline thresholds
          <em v-if="!isDeadlinesEnabled" class="text-muted-foreground text-sm"
            >(enable {{ NOTIFICATIONS_CONFIG["deadlineReminders"].title }} for
            it to make sense )
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
                      ? settings.deadlineReminders.thresholds.includes(
                          threshold,
                        )
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
    </section>

    <div v-if="account" class="max-w-sm">
      <div>
        <div class="text-muted-foreground mb-2">
          Telegram ID:
          <strong>{{ account.telegramId || "not connected" }}</strong>
        </div>
        <Dialog v-model:open="showOtpModal">
          <DialogTrigger as-child>
            <Button size="sm" @click="connect">
              {{ account.telegramId ? "Change Telegram" : "Connect Telegram" }}
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
      </div>
    </div>
  </section>
</template>
