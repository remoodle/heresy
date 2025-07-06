<script setup lang="ts">
import { ref } from "vue";
import { useQueryClient, useMutation } from "@tanstack/vue-query";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { TELEGRAM_BOT_URL } from "@/shared/config";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";
import { useToast } from "@/shared/ui/toast";
import { useUserStore } from "@/shared/stores/user";
import ConnectLayout from "./ConnectLayout.vue";

defineProps<{
  telegramId?: number;
}>();

const otp = ref<string>("");
const showOtpModal = ref(false);

const connect = () => {
  setTimeout(() => {
    window.open(`${TELEGRAM_BOT_URL}?start=connect`, "_blank");
  }, 1000);
};

const userStore = useUserStore();

const queryClient = useQueryClient();

const { toast } = useToast();

const { mutate: verifyOtp, isPending: verifying } = useMutation({
  mutationFn: async (otp: string) =>
    requestUnwrap((client) =>
      client.v2.otp.verify.$post(
        { json: { otp } },
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
</script>

<template>
  <ConnectLayout>
    <template #title> Telegram </template>
    <template #description> Primary source {{ telegramId }} </template>
    <template #icon>
      <Icon name="telegram_logo" class="size-8" />
    </template>
    <Dialog v-model:open="showOtpModal">
      <DialogTrigger as-child>
        <Button
          size="sm"
          :variant="telegramId ? 'outline' : 'default'"
          @click="connect"
        >
          {{ telegramId ? "Change" : "Connect" }}
        </Button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle> Enter OTP </DialogTitle>
          <DialogDescription>
            It was sent to your Telegram account
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="verifyOtp(otp)">
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
  </ConnectLayout>
</template>
