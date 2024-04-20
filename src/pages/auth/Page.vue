<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { ProviderDialog } from "@/entities/provider";
import { Footer } from "@/widgets/footer";
import { RouteName } from "@/shared/types";
import { Link } from "@/shared/ui/link";
import { useAppStore } from "@/shared/stores/app";
import TokenForm from "./ui/TokenForm.vue";
import LoginForm from "./ui/LoginForm.vue";
import SignupForm from "./ui/SignupForm.vue";

const route = useRoute();

const appStore = useAppStore();

const { providerId, availableProviders } = storeToRefs(appStore);
</script>

<template>
  <ProviderDialog
    v-model:provider-id="providerId"
    v-model:providers="availableProviders"
  >
    <template #default="{ selectedProvider }">
      <div
        class="flex w-full items-center gap-2 border-b px-3 py-2 duration-300 hover:bg-accent"
      >
        <div class="container mx-auto">
          <p v-if="selectedProvider">
            Connected to
            <span>
              {{ selectedProvider.name }}
              <!-- <span class="text-sm text-muted-foreground">
                {{ getURLHost(selectedProvider.api) }}
              </span> -->
            </span>
          </p>
          <p v-else>Click here to select API Provider</p>
        </div>
      </div>
    </template>
  </ProviderDialog>

  <div
    class="container grid h-full grid-cols-1 flex-col items-center justify-center lg:max-w-none lg:px-0"
  >
    <div class="lg:p-8">
      <div
        class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
      >
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            <template v-if="route.name === RouteName.Login">
              Welcome back
            </template>
            <template v-else> Let's go! </template>
          </h1>
          <p class="text-sm text-muted-foreground">
            <template v-if="route.name === RouteName.Login">
              Enter your credentials below to login
            </template>
            <template v-else> Fill in your details to get started </template>
          </p>
        </div>
        <template v-if="route.name === RouteName.Login">
          <LoginForm />
        </template>
        <template v-if="route.name === RouteName.Token">
          <TokenForm />
        </template>
        <template v-else-if="route.name === RouteName.SignUp">
          <SignupForm />
        </template>
        <p class="px-8 text-center text-sm text-muted-foreground">
          {{
            route.name === RouteName.Login
              ? "Don't have an account?"
              : "Already have an account?"
          }}
          <Link
            underline
            hover
            :to="{
              name:
                route.name === RouteName.Login
                  ? RouteName.SignUp
                  : RouteName.Login,
            }"
          >
            {{ route.name === RouteName.Login ? "Sign up" : "Sign in" }}
          </Link>
        </p>
        <template v-if="route.name !== RouteName.Login">
          <p class="text-center text-sm text-muted-foreground">
            By continuing, you agree to our
            <Link :to="{ name: RouteName.Terms }" underline hover
              >Terms of Service</Link
            >
            and
            <Link :to="{ name: RouteName.Privacy }" underline hover
              >Privacy Policy</Link
            >.
          </p>
        </template>
      </div>
    </div>
  </div>
  <Footer slim />
</template>
