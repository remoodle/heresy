<script setup lang="ts">
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
import { Logo } from "@/widgets/logo";
import { useUserStore } from "@/shared/stores/user";
import { RouteName } from "@/shared/types";
import MagicSearch from "./MagicSearch.vue";

const userStore = useUserStore();

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}
</script>

<template>
  <header
    class="fixed top-0 z-[20] flex h-16 w-full flex-none justify-center bg-background shadow-sm"
  >
    <div class="container flex h-full w-full items-center justify-between">
      <Link :to="{ name: RouteName.Home }">
        <Logo class="h-12 w-12 flex-none" />
      </Link>
      <MagicSearch />
      <DropdownMenu v-if="userStore.user" :modal="false">
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
