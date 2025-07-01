<script setup lang="ts">
import { ref, computed, watchEffect, defineAsyncComponent } from "vue";
import { useQueryClient, useMutation, useQuery } from "@tanstack/vue-query";
import { useUserStore } from "@/shared/stores/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { isEmptyString } from "@/shared/lib/helpers";
import { requestUnwrap, getAuthHeaders } from "@/shared/lib/hc";
import { useToast } from "@/shared/ui/toast";
import { features } from "@/shared/config/features";
import type { IUser } from "@remoodle/types";

const AccountDeletion = defineAsyncComponent(
  () => import("./ui/AccountDeletion.vue"),
);

const { toast } = useToast();

const userStore = useUserStore();

const { data: account, suspense } = useQuery({
  queryKey: ["private", "user", "settings"],
  queryFn: async () =>
    await requestUnwrap((client) =>
      client.v2.user.settings.$get({}, { headers: getAuthHeaders() }),
    ),
});

const handle = ref("");

watchEffect(() => {
  handle.value = userStore.user?.handle ?? "";
});

const MAX_HANDLE_LENGTH = 20;
const canUpdateHandle = computed(() => {
  if (updatingHandle.value) {
    return true;
  }

  const USERNAME_REGEX = new RegExp(`^.{1,${MAX_HANDLE_LENGTH}}$`);

  return (
    !handle.value.match(USERNAME_REGEX) ||
    isEmptyString(handle.value) ||
    handle.value === userStore.user?.handle
  );
});

const queryClient = useQueryClient();

const { mutate: updateHandle, isPending: updatingHandle } = useMutation({
  mutationFn: async (handle: string) =>
    requestUnwrap((client) =>
      client.v2.user.settings.$post(
        { json: { handle } },
        { headers: getAuthHeaders() },
      ),
    ),
  onSuccess: (data, variables) => {
    queryClient.setQueryData(["private", "user"], (old: IUser) => {
      return {
        ...old,
        handle: variables,
      };
    });
  },
  onError: (error) => {
    toast({
      title: error.message,
    });
  },
});

const showPasswordDialog = ref(false);
const currentPassword = ref<string>("");
const newPassword = ref<string>("");

const resetPasswordFields = () => {
  currentPassword.value = "";
  newPassword.value = "";
};

const canUpdatePassword = computed(() => {
  if (updatingPassword.value) {
    return true;
  }

  return isEmptyString(newPassword.value);
});

const { mutate: updatePassword, isPending: updatingPassword } = useMutation({
  mutationFn: async () =>
    requestUnwrap((client) =>
      client.v2.user.settings.$post(
        { json: { password: newPassword.value } },
        { headers: getAuthHeaders() },
      ),
    ),
  onSuccess: () => {
    resetPasswordFields();

    showPasswordDialog.value = false;

    queryClient.setQueryData(
      ["private", "user", "settings"],
      (old: Record<string, unknown>) => {
        return {
          ...old,
          hasPassword: true,
        };
      },
    );

    toast({
      title: "Password updated",
    });
  },
  onError: (error) => {
    toast({
      title: error.message,
    });
  },
});

await suspense();
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-xl font-medium">Profile</h1>
      <p class="text-muted-foreground text-sm">Account information</p>
    </div>
    <Separator />
    <form @submit.prevent="updateHandle(handle)">
      <div class="grid gap-2">
        <Label for="name">Handle</Label>
        <Input
          id="name"
          v-model="handle"
          placeholder="user-177"
          type="string"
          auto-capitalize="none"
          auto-correct="off"
          :maxlength="MAX_HANDLE_LENGTH"
          :disabled="updatingHandle"
          required
        />
      </div>
      <div class="py-2"></div>
      <Button type="submit" :disabled="canUpdateHandle">Save</Button>
    </form>

    <Separator />

    <div v-if="account" class="grid gap-2">
      <Label for="password">Password</Label>
      <div>
        <Dialog
          v-model:open="showPasswordDialog"
          @update:open="
            (value) => {
              if (!value) {
                resetPasswordFields();
              }
            }
          "
        >
          <DialogTrigger>
            <Button variant="outline">
              {{ account.hasPassword ? "Change" : "Set" }} password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {{ account.hasPassword ? "Change" : "Set" }} password
              </DialogTitle>
              <DialogDescription>
                <p v-if="!account.hasPassword" class="break-words">
                  for <strong>{{ userStore.user?.handle }}</strong>
                </p>
              </DialogDescription>
            </DialogHeader>

            <form class="space-y-6" @submit.prevent="updatePassword()">
              <div class="grid gap-2">
                <Label for="user_new_password">New password</Label>
                <Input
                  id="user_new_password"
                  v-model="newPassword"
                  placeholder="••••••••••••"
                  type="password"
                  passwordrules="minlength: 15; allowed: unicode;"
                  autocomplete="off"
                  spellcheck="false"
                  :disabled="updatingPassword"
                  required
                />
              </div>

              <DialogFooter class="sm:justify-start">
                <Button type="submit" :disabled="canUpdatePassword">
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <Separator />

    <AccountDeletion v-if="features.enableAccountDeletion" />
  </section>
</template>
