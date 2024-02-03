<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { api } from "@/shared/api";
import { createAsyncProcess } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

const userStore = useUserStore();

const mimicAuthToken = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("1239405234ra--f-sfsdfsd1");
    }, 1000);
  });
};

const step = ref(1);

const nextStep = () => {
  step.value += 1;
};

const prevStep = () => {
  step.value -= 1;
};

const barcode = ref("");
const token = ref("");

const code = ref("");

const { run: getAuthToken, loading: gettingAuthToken } = createAsyncProcess(
  async () => {
    const data = (await mimicAuthToken()) as string;

    token.value = data;

    nextStep();
  },
);

const login = async () => {
  if (step.value === 1) {
    await getAuthToken();
    return;
  }

  if (step.value === 2) {
    // with code and token
    userStore.login();
  }
};

onBeforeRouteLeave((to, from, next) => {
  if (step.value !== 1 && !userStore.authorized) {
    const answer = window.confirm(
      "Are you sure you want to leave? You will lose your progress",
    );

    if (!answer) {
      next(false);
      return;
    }
  }

  next();
});
</script>

<template>
  <main class="container mx-auto max-w-md">
    {{ step }}
    {{ token }}
    {{ code }}
    <form class="flex flex-col gap-2" @submit.prevent="login">
      <template v-if="step === 1">
        <Input
          v-model="barcode"
          type="text"
          placeholder="barcode"
          required
          :disabled="gettingAuthToken"
        />
      </template>
      <template v-if="step === 2">
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            we have sent you a code in telegram
          </AlertDescription>
        </Alert>

        <Input v-model="code" type="text" placeholder="code" required />
      </template>
      <Button class="w-full" type="submit" :disabled="gettingAuthToken">
        Login
      </Button>
    </form>
  </main>
</template>
