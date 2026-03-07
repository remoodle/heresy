<script setup lang="ts">
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { Icon } from "@iconify/vue";
</script>

<template>
  <div class="py-6">
    <div class="w-fit">
      <div class="flex flex-col gap-4">
        <div class="flex justify-between gap-12">
          <div class="flex items-center gap-3">
            <div class="flex flex-col items-center justify-center gap-0.5">
              <ThemeSwitcher class="flex-none" />
              <span class="text-muted-foreground text-xs"> theme </span>
            </div>
            <div class="flex flex-col items-center justify-center gap-0.5">
              <a
                href="https://t.me/remoodle"
                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <Icon icon="mdi:telegram" class="h-6 w-6" />
              </a>
              <span class="text-muted-foreground text-xs"> chat </span>
            </div>

            <div class="flex flex-col items-center justify-center gap-0.5">
              <a
                href="https://t.me/FeatherMoodBot"
                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <Icon icon="mdi:telegram" class="h-6 w-6" />
              </a>
              <span class="text-muted-foreground text-xs"> bot </span>
            </div>

            <div class="flex flex-col items-center justify-center gap-0.5">
              <a
                href="https://t.me/donateremoodle"
                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <Icon icon="mdi:telegram" class="h-6 w-6" />
              </a>
              <span class="text-muted-foreground text-xs"> donate </span>
            </div>

            <div class="flex flex-col items-center justify-center gap-0.5">
              <a
                href="https://github.com/remoodle"
                class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <Icon icon="mdi:github" class="h-6 w-6" />
              </a>
              <span class="text-muted-foreground text-xs"> ⭐ </span>
            </div>
          </div>
        </div>
        <span class="text-muted-foreground text-xs"> Powered by ReMoodle </span>
      </div>
    </div>
  </div>
</template>
