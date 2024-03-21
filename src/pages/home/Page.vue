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
import { createAsyncProcess } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";
import { Header } from "@/widgets/header";
import { onMounted } from "vue";

const userStore = useUserStore();

const { run, loading } = createAsyncProcess(async () => {
  // const res = await api.get("/user");
  // userStore.setUser(res.data);

  const [data, error] = await api.getActiveCourses();
});

onMounted(async () => {
  await run();
});
</script>

<template>
  123
  <!-- <Header /> -->
  <!-- <main class="container mx-auto max-w-md">
    {{ userStore.user }}
    {{ !!userStore.user }}
    {{ userStore.authorized }} -->
  home

  <!-- <Button class="w-full" variant="destructive" @click="userStore.logout()">
    Logout
  </Button> -->
  <!-- </main> -->
</template>
