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

const userStore = useUserStore();
</script>

<template>
  <main class="container mx-auto max-w-md">
    {{ userStore.user }}
    {{ !!userStore.user }}
    {{ userStore.authorized }}

    <Button class="w-full" variant="destructive" @click="userStore.logout()">
      Logout
    </Button>
  </main>
</template>
