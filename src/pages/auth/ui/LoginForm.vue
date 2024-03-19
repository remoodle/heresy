<script setup lang="ts">
import { ref } from "vue";
import { cn, isDefined } from "@/shared/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { api } from "@/shared/api";
import { createAsyncProcess, vFocus } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

const userStore = useUserStore();

const form = ref({
  // email: "",
  name: "",
  password: "",
});

const { run: submit, loading } = createAsyncProcess(async () => {
  const [data, error] = await api.login({
    identifier: form.value.name,
    password: form.value.password,
  });

  if (error) {
    throw error;
  }

  userStore.setToken(data.token);

  // TODO: remove shit when API is fixed
  const [userData, userError] = await api.getUserSettings();

  if (userError) {
    throw userError;
  }

  userStore.login(userStore.token, {
    moodle_id: userData.moodle_id,
    barcode: userData.barcode,
    name: userData.name,
    ...(isDefined(userData.name_alias) && { name_alias: userData.name_alias }),
    ...(isDefined(userData.email) && { name_alias: userData.email }),
  });
});
</script>

<template>
  <div :class="cn('grid gap-6', $attrs.class ?? '')">
    <form @submit.prevent="submit">
      <div class="grid gap-5">
        <div class="grid gap-3">
          <div class="grid gap-1.5">
            <Label for="name">Username</Label>
            <Input
              v-focus
              v-model="form.name"
              placeholder="messi2009"
              id="name"
              type="text"
              autocomplete="username"
              auto-capitalize="none"
              auto-correct="off"
              :disabled="loading"
            />
          </div>
          <!-- <div class="grid gap-1.5">
            <Label for="email">Email</Label>
            <Input
              v-focus
              v-model="form.email"
              placeholder="name@example.com"
              id="email"
              type="email"
              autocomplete="email"
              auto-capitalize="none"
              auto-correct="off"
              :disabled="loading"
            />
          </div> -->
          <div class="grid gap-1.5">
            <Label for="password">Password</Label>
            <Input
              v-model="form.password"
              placeholder="123123123"
              id="password"
              type="password"
              auto-capitalize="none"
              auto-correct="off"
              :disabled="loading"
            />
          </div>
        </div>
        <Button :disabled="loading"> Sign In with Email </Button>
      </div>
    </form>
    <!-- <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <span class="w-full border-t" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>
    </div> -->
    <!-- <Button variant="outline" type="button" :disabled="isLoading">
      <LucideSpinner v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
      <GitHubLogo v-else class="mr-2 h-4 w-4" />
      GitHub
    </Button> -->
  </div>
</template>
