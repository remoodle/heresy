<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useMutation } from "@tanstack/vue-query";
import { computed, ref } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";

const open = ref(false);

const {
  mutate: signInWithGitHub,
  isPending: githubPending,
  error: githubError,
} = useMutation({
  mutationFn: () =>
    authClient.signIn
      .social({ provider: "github", callbackURL: "/" })
      .then(({ error }) => {
        if (error) throw new Error(error.message ?? "Sign in failed");
      }),
});

const {
  mutate: signInWithMicrosoft,
  isPending: microsoftPending,
  error: microsoftError,
} = useMutation({
  mutationFn: () =>
    authClient.signIn
      .social({ provider: "microsoft", callbackURL: "/" })
      .then(({ error }) => {
        if (error) throw new Error(error.message ?? "Sign in failed");
      }),
});

const loading = computed(() => githubPending.value || microsoftPending.value);
const error = computed(
  () =>
    (githubError.value as Error)?.message ||
    (microsoftError.value as Error)?.message ||
    "",
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="max-w-80 rounded-2xl md:max-w-sm">
      <DialogHeader>
        <DialogTitle class="text-left text-xl font-bold">Sign in</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-3">
        <Button
          variant="outline"
          :disabled="loading"
          @click="() => signInWithGitHub()"
        >
          <Icon icon="mdi:github" class="mr-2 h-5 w-5" />
          {{ githubPending ? "Redirecting..." : "Continue with GitHub" }}
        </Button>
        <Button
          variant="outline"
          :disabled="loading"
          @click="() => signInWithMicrosoft()"
        >
          <Icon icon="mdi:microsoft" class="mr-2 h-5 w-5" />
          {{ microsoftPending ? "Redirecting..." : "Continue with Microsoft" }}
        </Button>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      </div>
    </DialogContent>
  </Dialog>
</template>
