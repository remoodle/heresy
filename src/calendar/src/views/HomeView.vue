<script lang="ts" setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { storeToRefs } from "pinia";
import { watchEffect } from "vue";
import { useSchedule } from "@/composables/use-schedule";
import { useAppStore } from "@/stores/app";
import Schedule from "@/components/Schedule.vue";
import GroupSelect from "@/components/GroupSelect.vue";
import ScheduleSettings from "@/components/ScheduleSettings.vue";
import Footer from "@/components/Footer.vue";
import ExportToIcal from "@/components/ExportToIcal.vue";

const appStore = useAppStore();

const { group, filters } = storeToRefs(appStore);

const { groupSchedule, allGroups, groupCourses } = useSchedule(
  () => group.value,
  () => filters.value,
);

watchEffect(() => {
  if (allGroups.value && !allGroups.value.includes(group.value)) {
    group.value = "";
  }
});
</script>

<template>
  <div class="flex justify-center mx-auto max-w-screen">
    <div class="flex flex-col p-4 gap-3">
      <div class="flex flex-wrap justify-between items-start gap-3">
        <GroupSelect v-model="group" :all-groups="allGroups || []" />
        <div class="flex gap-3 sm:w-fit w-full">
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="default">Filters</Button>
            </DialogTrigger>
            <DialogContent class="rounded-2xl max-w-80 md:max-w-sm">
              <DialogHeader>
                <DialogTitle class="text-xl font-bold text-left">
                  Filters for {{ group }}
                </DialogTitle>
                <DialogDescription class="text-left">
                  Click on any option to change its value.
                </DialogDescription>
              </DialogHeader>
              <template v-if="group && filters && filters[group]">
                <ScheduleSettings
                  class="max-w-xs"
                  v-model="filters[group]!"
                  :group="group"
                  :courses="groupCourses"
                />
              </template>
            </DialogContent>
          </Dialog>
          <template v-if="group && filters && filters[group]">
            <ExportToIcal :events="groupSchedule" :group="group" :filters="filters[group]" />
          </template>
        </div>
      </div>

      <Schedule class="h-[89vh] w-[90vw]" :events="groupSchedule" :theme="appStore.theme" />
      <!-- <Footer /> -->
    </div>
  </div>
</template>
