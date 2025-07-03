<script setup lang="ts">
import { ref, toRaw, watch, watchEffect } from "vue";
import { useQueryClient, useMutation, useQuery } from "@tanstack/vue-query";
import type { UserSettings } from "@remoodle/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
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

await suspense();
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

    <section v-if="account && settings">
      <Table class="max-w-2xl">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[420px]"> </TableHead>
            <TableHead class="text-right"> Telegram </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell class="font-medium"> 📘 Updated grades </TableCell>
            <TableCell class="text-right">
              <Switch
                :model-value="
                  !account.telegramId
                    ? false
                    : settings.notifications['gradeUpdates::telegram'] === 1
                "
                :disabled="!account.telegramId || updatingNotifications"
                @update:model-value="
                  (value) =>
                    (settings!.notifications['gradeUpdates::telegram'] = value
                      ? 1
                      : 0)
                "
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">
              🔔 Upcoming deadlines

              <div
                class="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-6 md:gap-y-4"
              >
                <template
                  v-for="threshold in AVAILABLE_THRESHOLDS"
                  :key="threshold"
                >
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
                          settings.notifications[
                            'deadlineReminders::telegram'
                          ] === 0
                        "
                        @update:model-value="
                          (value) =>
                            (settings!.deadlineReminders.thresholds = value
                              ? [
                                  ...settings!.deadlineReminders.thresholds,
                                  threshold,
                                ]
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
            </TableCell>
            <TableCell class="text-right">
              <Switch
                :model-value="
                  !account.telegramId
                    ? false
                    : settings.notifications['deadlineReminders::telegram'] ===
                      1
                "
                :disabled="!account.telegramId || updatingNotifications"
                @update:model-value="
                  (value) =>
                    (settings!.notifications['deadlineReminders::telegram'] =
                      value ? 1 : 0)
                "
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell class="font-medium">
              📋 Course changes
              <div class="text-sm text-muted-foreground mt-1">
                Get notified when courses are added, removed, or change status (e.g., from in progress to past)
              </div>
            </TableCell>
            <TableCell class="text-right">
              <Switch
                :model-value="
                  !account.telegramId
                    ? false
                    : settings.notifications['courseChanges::telegram'] === 1
                "
                :disabled="!account.telegramId || updatingNotifications"
                @update:model-value="
                  (value) =>
                    (settings!.notifications['courseChanges::telegram'] =
                      value ? 1 : 0)
                "
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
