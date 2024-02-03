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

const login = async () => {
  userStore.login();
};
</script>

<template>
  <main class="container mx-auto max-w-md">
    {{ userStore.user }}
    {{ !!userStore.user }}
    {{ userStore.authorized }}
    <form class="flex flex-col gap-2" @submit.prevent="login">
      <Input type="text" placeholder="Email" />
      <Button class="w-full" type="submit"> Login </Button>
    </form>

    <!-- <Button> Click </Button>
    Hello Hello Hello

    <Alert variant="destructive">
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>

    <AlertDialog>
      <AlertDialogTrigger>Open</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Badge>Badge</Badge>

    <Badge variant="outline"> Outline </Badge>

    <Badge variant="destructive"> Destructive </Badge> -->
  </main>
</template>
