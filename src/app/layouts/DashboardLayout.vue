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
import { Footer } from "@/widgets/footer";

const userStore = useUserStore();
</script>

<template>
  <Header />
  <div class="bg-secondary">
    <div class="mb-10 mt-28 flex-wrap justify-between sm:flex">
      <main class="flex w-full flex-col">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="['DashboardPage']">
            <Component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
  <Footer />

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
