<script setup lang="ts">
import { cn, objectEntries } from "@/shared/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { getURLHost } from "@/shared/utils";
import type { Providers } from "@/shared/types";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

defineModel<string | undefined>("provider", {
  required: true,
});

defineModel<Providers>("providers", {
  required: true,
});
</script>

<template>
  <Dialog>
    <DialogTrigger>
      <div
        :class="
          cn(
            'flex w-full items-center gap-2 border-b px-3 py-2 duration-300 hover:bg-accent',
            $attrs.class ?? '',
          )
        "
      >
        <p v-if="provider">
          Connected to
          <span>
            {{ providers[provider].name }}
            <span class="text-sm text-muted-foreground">
              {{ getURLHost(providers[provider].api) }}
            </span>
          </span>
        </p>
      </div>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Select API Provider</DialogTitle>
        <DialogDescription>
          You can change the API provider to connect to a different server
        </DialogDescription>
        <RadioGroup
          class="flex flex-col space-y-1"
          :model-value="provider"
          @update:model-value="$emit('update:provider', $event)"
        >
          <template v-for="[k, v] in objectEntries(providers)" :key="k">
            <div class="flex items-center space-x-2">
              <RadioGroupItem :id="k" :value="k" />
              <Label :for="k">{{ v.name }} ({{ getURLHost(v.api) }})</Label>
            </div>
          </template>
        </RadioGroup>
      </DialogHeader>
    </DialogContent>
  </Dialog>
</template>
