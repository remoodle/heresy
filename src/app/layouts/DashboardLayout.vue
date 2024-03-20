<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { api } from "@/shared/api";
import { useUserStore } from "@/shared/stores/user";
import { Header } from "@/widgets/header";

const userStore = useUserStore();
</script>

<template>
  <Header />
  <div class="container mx-auto flex-wrap justify-between p-5 sm:flex">
    <main class="m-auto flex w-full flex-col items-center justify-center">
      <RouterView></RouterView>
    </main>
  </div>
  <!-- <main class="container mx-auto max-w-md">
    {{ userStore.user }}
    {{ !!userStore.user }}
    {{ userStore.authorized }} -->
  <!-- home -->

  <!-- <Button class="w-full" variant="destructive" @click="userStore.logout()">
    Logout
  </Button> -->
  <!-- </main> -->
</template>
