<script setup lang="ts">
import type { NotificationSettings } from "@remoodle/types";
import { Checkbox } from "@/shared/ui/checkbox";
import { NOTIFICATION_SETTING_STATE } from "../lib";
import type { SettingState } from "../lib";

defineProps<{
  disabled: boolean;
  notification: string;
  value: number;
}>();

const emit = defineEmits<{
  update: [notification: keyof NotificationSettings, value: SettingState];
}>();
</script>

<template>
  <Checkbox
    class="align-top"
    :model-value="
      value === NOTIFICATION_SETTING_STATE.mandatory ||
      value === NOTIFICATION_SETTING_STATE.enabled
        ? true
        : false
    "
    :disabled="disabled || value === NOTIFICATION_SETTING_STATE.mandatory"
    @update:model-value="
      (value) => {
        emit(
          'update',
          notification as keyof NotificationSettings,
          value
            ? NOTIFICATION_SETTING_STATE.enabled
            : NOTIFICATION_SETTING_STATE.disabled,
        );
      }
    "
  />
</template>
