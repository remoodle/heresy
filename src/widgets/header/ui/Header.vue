<script setup lang="ts">
import { Logo } from "@/widgets/logo";
import { Button } from "@/shared/ui/button";
import { Link } from "@/shared/ui/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { useUserStore } from "@/shared/stores/user";
import { RouteName } from "@/shared/types";
import { getInitials } from "@/shared/utils";

const userStore = useUserStore();
</script>

<template>
  <header
    class="border-base-300 bg-base-200 flex h-16 w-full justify-center border-b shadow-sm"
  >
    <div class="container flex h-full w-full items-center justify-between">
      <Link :to="{ name: RouteName.Home }">
        <Logo />
      </Link>

      <DropdownMenu v-if="userStore.user">
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarFallback>
              {{ getInitials(userStore.user.name) }}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <RouterLink :to="{ name: RouteName.Account }">
            <DropdownMenuItem> Account </DropdownMenuItem>
          </RouterLink>
          <DropdownMenuItem @click="userStore.logout">
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
