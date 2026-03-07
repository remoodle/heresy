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
import SearchModeSelect from "@/components/SearchModeSelect.vue";
import SearchSelect from "@/components/SearchSelect.vue";
import ScheduleSettings from "@/components/ScheduleSettings.vue";
import Footer from "@/components/Footer.vue";
import ExportToIcal from "@/components/ExportToIcal.vue";

const appStore = useAppStore();

const { searchMode, value, filters } = storeToRefs(appStore);

const { groupSchedule, allOptions, valueCourses } = useSchedule(
  () => searchMode.value,
  () => value.value,
  () => filters.value,
);

watchEffect(() => {
  if (
    allOptions.value &&
    value.value &&
    !allOptions.value.includes(value.value)
  ) {
    value.value = "";
  }
});
</script>

<template>
  <div class="flex justify-center mx-auto max-w-screen">
    <div class="flex flex-col p-4 gap-3">
      <div class="flex flex-wrap justify-between items-start gap-3">
        <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <SearchModeSelect v-model="searchMode" />
          <SearchSelect
            v-model="value"
            :mode="searchMode"
            :options="allOptions || []"
          />
        </div>
        <div class="flex gap-3 sm:w-fit w-full">
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="default">Filters</Button>
            </DialogTrigger>
            <DialogContent class="rounded-2xl max-w-80 md:max-w-sm">
              <DialogHeader>
                <DialogTitle class="text-xl font-bold text-left">
                  Filters for {{ value }}
                </DialogTitle>
                <DialogDescription class="text-left">
                  Click on any option to change its value.
                </DialogDescription>
              </DialogHeader>
              <template v-if="value && filters && filters[value]">
                <ScheduleSettings
                  class="max-w-xs"
                  v-model="filters[value]!"
                  :value="value"
                  :courses="valueCourses"
                />
              </template>
            </DialogContent>
          </Dialog>
          <template v-if="value && filters && filters[value]">
            <ExportToIcal
              :events="groupSchedule"
              :value="value"
              :search-mode="searchMode"
              :filters="filters[value]"
            />
          </template>
        </div>
      </div>

      <Schedule
        class="h-[89vh] w-[90vw]"
        :events="groupSchedule"
        :theme="appStore.theme"
      />
      <!-- <Footer /> -->
    </div>
  </div>
</template>
