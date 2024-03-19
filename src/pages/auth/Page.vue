<script setup lang="ts">
import { useRoute } from "vue-router";
import { RouteName } from "@/shared/types";
import LoginForm from "./ui/LoginForm.vue";
import SignupForm from "./ui/SignupForm.vue";

const route = useRoute();
</script>

<template>
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
              Login to your account
            </template>
            <template v-else-if="route.name === RouteName.SignUp">
              Create account
            </template>
          </h1>
          <p class="text-sm text-muted-foreground">
            <template v-if="route.name === RouteName.Login">
              Enter your email below to create your account
            </template>
            <template v-else-if="route.name === RouteName.SignUp">
              Fill in your details to get started
            </template>
          </p>
        </div>
        <template v-if="route.name === RouteName.Login">
          <LoginForm />
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
          <RouterLink
            :to="{
              name:
                route.name === RouteName.Login
                  ? RouteName.SignUp
                  : RouteName.Login,
            }"
            class="underline underline-offset-4 hover:text-primary"
          >
            {{ route.name === RouteName.Login ? "Sign up" : "Sign in" }}
          </RouterLink>
        </p>
        <template v-if="route.name === RouteName.SignUp">
          <p class="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our
            <a
              href="/terms"
              class="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>
            and
            <a
              href="/privacy"
              class="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
