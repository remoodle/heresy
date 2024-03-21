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
  <div class="bg-secondary">
    <div class="container mx-auto my-10 flex-wrap justify-between sm:flex">
      <main class="flex w-full flex-col">
        <RouterView></RouterView>
      </main>
    </div>
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
