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
import { Picture } from "@/shared/ui/picture";
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
    class="top-0 z-[20] flex h-16 w-full flex-none justify-center bg-background shadow-sm"
    :class="{ sticky: !$route.meta.unstickyHeader }"
  >
    <div class="container flex h-full w-full items-center justify-between">
      <div class="inline-flex w-1/2 items-center justify-start">
        <Link :to="{ name: RouteName.Home }">
          <Logo class="h-12 w-12 flex-none" />
        </Link>
      </div>
      <div class="flex-shrink-1 hidden h-full w-full justify-center lg:flex">
        <!-- <MagicSearch /> -->
      </div>
      <div class="ml-auto inline-flex w-1/2 items-center justify-end">
        <DropdownMenu v-if="userStore.user" :modal="false">
          <DropdownMenuTrigger>
            <Picture :name="userStore.user.moodle_id" :size="36" />
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
    </div>
  </header>
</template>
