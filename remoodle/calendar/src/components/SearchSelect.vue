<script setup lang="ts">
import { computed, ref } from "vue";
import type { SearchMode } from "@/composables/use-schedule";
import { ChevronsUpDown } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const props = defineProps<{
  mode: SearchMode;
  options: string[];
}>();

const value = defineModel<string>({ required: true });

const open = ref(false);

const placeholder = computed(() => {
  switch (props.mode) {
    case "group":
      return "Select group";
    case "location":
      return "Select location";
    case "teacher":
      return "Select teacher";
    default:
      return "Select";
  }
});

const searchPlaceholder = computed(() => {
  switch (props.mode) {
    case "group":
      return "Search group...";
    case "location":
      return "Search location...";
    case "teacher":
      return "Search teacher...";
    default:
      return "Search...";
  }
});

const emptyMessage = computed(() => {
  switch (props.mode) {
    case "group":
      return "Group not found.";
    case "location":
      return "Location not found.";
    case "teacher":
      return "Teacher not found.";
    default:
      return "Not found.";
  }
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="min-w-full sm:min-w-48 justify-between"
      >
        {{ options.includes(value) ? value : placeholder }}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0">
      <Command v-model="value">
        <CommandInput :placeholder="searchPlaceholder" />
        <CommandEmpty>{{ emptyMessage }}</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="opt in options"
              :key="opt"
              :value="opt"
              @select="open = false"
            >
              {{ opt }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
