<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import {Logo} from "@/shared/ui/logo";
import {HamburgerMenuIcon, Cross1Icon} from '@radix-icons/vue'

const menuState = ref(false);
const isScrolled = ref(false);

const toggleMenu = () => {
  menuState.value = !menuState.value;
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const menuItems = [
  {name: 'Features', href: '#features'},
  {name: 'Team', href: '#team'},
  {name: 'Footer', href: '#footer'},
];
</script>

<template>
  <header>
    <nav :data-state="menuState ? 'active' : ''" class="fixed z-20 w-full px-2">
      <div
          class="mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12"
          :class="isScrolled ? 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5' : ''"
      >
        <div class="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
          <div class="flex w-full justify-between lg:w-auto">
            <a href="/" class="flex items-center space-x-2 gap-3 font-bold">
              <Logo class="size-8"/>
              ReMoodle
            </a>
            <button
                @click="toggleMenu"
                :aria-label="menuState ? 'Close Menu' : 'Open Menu'"
                class="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
            >
              <HamburgerMenuIcon v-if="!menuState" class="m-auto size-6 duration-200"/>
              <Cross1Icon v-else class="absolute inset-0 m-auto size-6 duration-200"/>
              close
            </button>
          </div>
          <div class="absolute inset-0 m-auto hidden size-fit lg:block">
            <ul class="flex gap-8 text-sm">
              <li v-for="(item, index) in menuItems" :key="index">
                <a
                    :href="item.href"
                    class="text-muted-foreground hover:text-accent-foreground block duration-150"
                >
                  <span>{{ item.name }}</span>
                </a>
              </li>
            </ul>
          </div>
          <div
              :class="menuState ? 'block' : 'hidden lg:flex'"
              class="bg-background mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent"
          >
            <div class="lg:hidden">
              <ul class="space-y-6 text-base">
                <li v-for="(item, index) in menuItems" :key="index">
                  <a
                      :href="item.href"
                      class="text-muted-foreground hover:text-accent-foreground block duration-150"
                  >
                    <span>{{ item.name }}</span>
                  </a>
                </li>
              </ul>
            </div>
            <div class="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
              <a href="#">
                <span>Get Started</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
