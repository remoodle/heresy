<script setup lang="ts">
import type { CalendarEvent } from "@schedule-x/calendar";
import {
  type DateValue,
  DateFormatter,
  getLocalTimeZone,
  today,
} from "@internationalized/date";
import { CalendarIcon, Download } from "lucide-vue-next";
import { ref, computed, watch, type Ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogScrollContent,
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
import {
  useIcalTokenQuery,
  useUpsertIcalToken,
  useUpdateIcalFilters,
} from "@/lib/api/ical";
import { useSessionQuery } from "@/lib/api/session";
import type { ScheduleFilter } from "@/lib/types";
import {
  generateCalendarEventsIcal,
  mergeAdjacentCalendarEvents,
} from "../../shared/ical";

const props = defineProps<{
  group: string;
  filters: ScheduleFilter | undefined;
  events: CalendarEvent[];
}>();

const value = ref(
  today(getLocalTimeZone()).add({ days: 14 }),
) as Ref<DateValue>;

const open = ref<boolean>(false);

const { data: session } = useSessionQuery();
const { data: tokenData, isPending: tokenPending } = useIcalTokenQuery(
  () => props.group,
);
const { mutate: generate, isPending: generating } = useUpsertIcalToken();
const { mutate: updateFilters, isPending: updatingFilters } =
  useUpdateIcalFilters();
const copied = ref(false);
const combineAdjacentPairs = ref(false);

const busy = computed(() => generating.value || updatingFilters.value);

const effectiveFilters = computed<ScheduleFilter | undefined>(() => {
  if (!props.filters) return undefined;

  return {
    ...props.filters,
    ical: {
      ...props.filters.ical,
      combineAdjacentPairs: combineAdjacentPairs.value,
    },
  };
});

watch(
  () => props.filters?.ical?.combineAdjacentPairs,
  (value) => {
    combineAdjacentPairs.value = value ?? false;
  },
  { immediate: true },
);

async function copyUrl() {
  if (!tokenData.value?.url) return;
  await navigator.clipboard.writeText(tokenData.value.url);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});

const getIcsString = () => {
  const end = value.value.toDate(getLocalTimeZone());
  const sourceEvents = combineAdjacentPairs.value
    ? mergeAdjacentCalendarEvents(props.events)
    : props.events;

  return generateCalendarEventsIcal(
    sourceEvents
      .filter(
        (
          event,
        ): event is typeof event & {
          title: string;
          description: string;
          start: string;
        } => Boolean(event.title && event.description && event.start),
      )
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        location: "Astana IT University",
      })),
    end,
  );
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
    <DialogScrollContent class="max-w-lg rounded-2xl">
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

      <div class="flex flex-col gap-1.5">
        <span class="text-sm font-medium">End Date</span>
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

      <label
        class="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
      >
        <Checkbox v-model:checked="combineAdjacentPairs" class="mt-0.5" />
        <div class="space-y-1">
          <p class="text-sm leading-none font-medium">Combine adjacent pairs</p>
          <p class="text-xs text-muted-foreground">
            Merge back-to-back slots with the same course details into one iCal
            event.
          </p>
        </div>
      </label>

      <template v-if="session?.data">
        <div class="flex flex-col gap-3 rounded-xl border p-4">
          <div>
            <p class="text-sm font-medium">iCal Subscription</p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Paste this URL into Google Calendar, Apple Calendar, or any app
              that supports calendar subscriptions.
            </p>
          </div>

          <template v-if="tokenPending || busy">
            <div
              class="flex h-8 items-center justify-center rounded-md border border-input bg-muted"
            >
              <span class="text-xs text-muted-foreground">Loading...</span>
            </div>
          </template>
          <template v-else-if="tokenData?.url">
            <div class="flex gap-2">
              <input
                :value="tokenData.url"
                readonly
                class="flex h-8 min-w-0 flex-1 rounded-md border border-input bg-muted px-3 py-2 text-xs text-muted-foreground ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                @click="($event.target as HTMLInputElement).select()"
              />
              <Button
                variant="outline"
                size="sm"
                class="shrink-0"
                @click="copyUrl"
              >
                {{ copied ? "Copied!" : "Copy" }}
              </Button>
            </div>
            <div class="flex items-center justify-between">
              <p class="text-xs text-muted-foreground">
                Sync your current filters to this URL.
              </p>
              <Button
                variant="ghost"
                size="sm"
                class="shrink-0 text-muted-foreground"
                :disabled="busy || !effectiveFilters"
                @click="updateFilters({ group, filters: effectiveFilters! })"
              >
                Update filters
              </Button>
            </div>
          </template>
          <template v-else>
            <Button
              variant="outline"
              :disabled="busy || !effectiveFilters"
              @click="generate({ group, filters: effectiveFilters! })"
            >
              Generate link
            </Button>
            <p class="text-xs text-muted-foreground">
              Generates a subscription URL with your current filters.
            </p>
          </template>
        </div>
      </template>

      <DialogFooter>
        <Button @click="getICalFile" type="submit" class="gap-2">
          <Download class="h-4 w-4" />
          Download .ics
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
