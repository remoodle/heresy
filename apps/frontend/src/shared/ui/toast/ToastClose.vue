<script setup lang="ts">
import { ToastClose } from "reka-ui";
import { XIcon } from "lucide-vue-next";
import { cn } from "@/shared/ui/utils";

const props = defineProps<{
  class?: string;
}>();
</script>

<template>
  <ToastClose
    v-bind="props"
    :class="
      cn(
        'text-foreground/50 hover:text-foreground absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:ring-2 focus:outline-none group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
        props.class,
      )
    "
  >
    <XIcon class="h-4 w-4" />
  </ToastClose>
</template>
