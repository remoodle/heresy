<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref } from "vue";
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
const loading = ref(false);
const error = ref("");

async function signInWithGitHub() {
  error.value = "";
  loading.value = true;
  const { error: err } = await authClient.signIn.social({
    provider: "github",
    callbackURL: "/",
  });
  loading.value = false;
  if (err) error.value = err.message ?? "Sign in failed";
}
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
        <Button variant="outline" :disabled="loading" @click="signInWithGitHub">
          <Icon icon="mdi:github" class="mr-2 h-5 w-5" />
          {{ loading ? "Redirecting..." : "Continue with GitHub" }}
        </Button>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      </div>
    </DialogContent>
  </Dialog>
</template>
