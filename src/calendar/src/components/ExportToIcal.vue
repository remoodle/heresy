<script setup lang="ts">
import type { CalendarEvent } from "@schedule-x/calendar";
import {
  type DateValue,
  DateFormatter,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { CalendarIcon, Download } from "lucide-vue-next";
import { ref, type Ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dayjs, type Dayjs } from "@/lib/dayjs";
import type { ScheduleFilter } from "@/lib/types";

const props = defineProps<{
  group: string;
  filters: ScheduleFilter | undefined;
  events: CalendarEvent[];
}>();

const value = ref(
  today(getLocalTimeZone()).add({ days: 14 }),
) as Ref<DateValue>;

const open = ref<boolean>(false);

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});

const escapeText = (text: string) => {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
};

const parseDate = (dateString: string) => {
  // e.g. 2025-09-04 21:00
  const [datePart, timePart] = dateString.split(" ");

  if (!datePart || !timePart) {
    return new Date();
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (!year || !month || !day || hour === undefined || minute === undefined) {
    return new Date();
  }

  return new Date(year, month - 1, day, hour, minute);
};

const formatDate = (date: Dayjs): string => {
  return date.format("YYYYMMDD[T]HHmmss").replace(/[-:]/g, "");
};

const getIcsString = () => {
  const icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ReMoodle//Calendar Export//EN",
  ];

  const end = dayjs(value.value.toDate(getLocalTimeZone()));

  if (!end) {
    return "";
  }

  props.events.forEach((event) => {
    if (event.title && event.description && event.start) {
      const startDate = parseDate(event.start);
      const endDate = end;

      for (
        let current = dayjs(startDate);
        current <= endDate;
        current = current.add(7, "day")
      ) {
        icalContent.push(
          `BEGIN:VEVENT`,
          `UID:${event.id}-${current.toISOString()}`,
          `SUMMARY:${escapeText(event.title)}`,
          `DTSTART:${formatDate(current)}`,
          `DTEND:${formatDate(current.add(50, "minute"))}`,
          `DESCRIPTION:${escapeText(event.description)}`,
          `LOCATION:Astana IT University`,
          `END:VEVENT`,
        );
      }
    }
  });

  icalContent.push("END:VCALENDAR");

  return icalContent.join("\n");
};

const getICalFile = (): void => {
  const blob = new Blob([getIcsString()], {
    type: "text/calendar;charset=utf-8",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "myCalendar.ics";
  link.click();
  URL.revokeObjectURL(link.href);
};
</script>

<template>
  <Dialog v-model:open="open" @update:open="open = $event">
    <DialogTrigger as-child>
      <Button size="sm" variant="outline">Export</Button>
    </DialogTrigger>
    <DialogContent class="max-w-sm rounded-2xl">
      <DialogHeader>
        <DialogTitle class="text-left text-2xl font-bold"
          >Create iCalendar file</DialogTitle
        >
        <DialogDescription class="text-ms text-left">
          Make changes to your calendar using <strong>filters</strong> and
          choose <strong>end date</strong> for events.
          <strong>Start date</strong> is set for today.
        </DialogDescription>
      </DialogHeader>

      <div class="mt-2">
        <h1 class="flex items-center font-bold">
          {{ group }}
        </h1>
      </div>

      <div class="flex flex-col gap-3 rounded-xl border p-4">
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium">Event Types</span>
          <div class="flex flex-wrap gap-1 select-none">
            <Badge
              v-for="(enabled, type) in filters?.eventTypes"
              :key="type"
              :variant="enabled ? 'default' : 'destructive'"
              >{{ type }}</Badge
            >
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium">Event Formats</span>
          <div class="flex flex-wrap gap-1 select-none">
            <Badge
              v-for="(enabled, format) in filters?.eventFormats"
              :key="format"
              :variant="enabled ? 'default' : 'destructive'"
              >{{ format }}</Badge
            >
          </div>
        </div>

        <div
          v-if="filters?.excludedCourses?.length"
          class="flex flex-col gap-1.5"
        >
          <span class="text-sm font-medium">Excluded Courses</span>
          <div class="flex flex-wrap gap-1 select-none">
            <Badge
              v-for="course in filters?.excludedCourses"
              :key="course"
              variant="destructive"
              >{{ course }}</Badge
            >
          </div>
        </div>
      </div>

      <div class="">
        <div class="flex gap-2">
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="w-full justify-start text-left font-normal"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{
                  value
                    ? df.format(value.toDate(getLocalTimeZone()))
                    : "Pick an end date"
                }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar v-model="value" initial-focus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <DialogFooter>
        <Button @click="getICalFile" type="submit" class="gap-2">
          <Download class="h-4 w-4" />
          Download .ics
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
