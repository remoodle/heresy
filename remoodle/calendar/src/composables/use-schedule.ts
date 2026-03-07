import { computed } from "vue";
import type { CalendarEvent } from "@schedule-x/calendar";
import type { ScheduleFilter, ScheduleItem } from "@/lib/types";
import { dayjs } from "@/lib/dayjs";
import {
  useGroupsQuery,
  useGroupScheduleQuery,
  useLocationsQuery,
  useLocationScheduleQuery,
  useTeachersQuery,
  useTeacherScheduleQuery,
} from "@/lib/api";

export type SearchMode = "group" | "location" | "teacher";

export function useSchedule(
  searchMode: () => SearchMode,
  value: () => string,
  filters: () => Record<string, ScheduleFilter>,
) {
  const currentMode = computed(() => searchMode());
  const currentValue = computed(() => value());
  const currentFilters = computed(() => filters());

  const { data: allGroups } = useGroupsQuery();
  const { data: allLocations } = useLocationsQuery();
  const { data: allTeachers } = useTeachersQuery();

  const { data: groupScheduleData } = useGroupScheduleQuery(() =>
    currentMode.value === "group" ? currentValue.value : "",
  );
  const { data: locationScheduleData } = useLocationScheduleQuery(() =>
    currentMode.value === "location" ? currentValue.value : "",
  );
  const { data: teacherScheduleData } = useTeacherScheduleQuery(() =>
    currentMode.value === "teacher" ? currentValue.value : "",
  );

  const schedule = computed(() => {
    switch (currentMode.value) {
      case "group":
        return groupScheduleData.value;
      case "location":
        return locationScheduleData.value;
      case "teacher":
        return teacherScheduleData.value;
      default:
        return undefined;
    }
  });

  const allOptions = computed(() => {
    switch (currentMode.value) {
      case "group":
        return allGroups.value ?? [];
      case "location":
        return allLocations.value ?? [];
      case "teacher":
        return allTeachers.value ?? [];
      default:
        return [];
    }
  });

  const getTargetDateByDay = (day: string): Date => {
    const [dayName, time] = day.split(" ");

    const daysMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    if (!time || !dayName) {
      return new Date();
    }

    const now = dayjs();
    const targetWeekday = daysMap[dayName];

    if (!targetWeekday) {
      return new Date();
    }

    const targetDate = now.weekday(targetWeekday);

    const [hours, minutes] = time.split(":");

    if (!hours || !minutes) {
      console.error("Invalid time", hours, minutes);
      return new Date();
    }

    return targetDate
      .hour(Number(hours))
      .minute(Number(minutes))
      .second(0)
      .millisecond(0)
      .toDate();
  };

  const convertToDateTime = (date: Date): string => {
    // Format 'Y-m-d HH:mm'
    return date
      .toLocaleString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(" ", "T")
      .slice(0, 16)
      .replace("T", " ");
  };

  const groupSchedule = computed((): CalendarEvent[] => {
    if (!currentValue.value || !schedule.value) {
      return [];
    }

    const userFilters = currentFilters.value?.[currentValue.value];
    const currentSchedule: ScheduleItem[] = schedule.value || [];

    if (!currentSchedule || currentSchedule.length === 0) {
      return [];
    }

    const filteredSchedule = currentSchedule.filter((item: ScheduleItem) => {
      if (!userFilters) {
        return true;
      }

      if (userFilters.excludedCourses.length > 0) {
        if (userFilters.excludedCourses.includes(item.courseName)) {
          return false;
        }
      }

      if (
        !userFilters.eventTypes.learn &&
        !userFilters.eventTypes.lecture &&
        !userFilters.eventTypes.practice
      ) {
        return true;
      }

      if (!userFilters.eventTypes.learn) {
        if (item.teacher.startsWith("https://learn")) {
          return false;
        }
      }

      if (!userFilters.eventTypes.lecture) {
        if (item.type === "lecture") {
          return false;
        }
      }

      if (!userFilters.eventTypes.practice) {
        if (item.type === "practice") {
          return false;
        }
      }

      if (
        !userFilters.eventFormats.offline &&
        !userFilters.eventFormats.online
      ) {
        return true;
      }

      if (!userFilters.eventFormats.offline) {
        if (item.location !== "online") {
          return false;
        }
      }

      if (!userFilters.eventFormats.online) {
        if (item.location === "online") {
          return false;
        }
      }

      return true;
    });

    // Convert the schedule to CalendarEvent format (also for the previous and next week)
    const resultSchedule: CalendarEvent[] = filteredSchedule.map((item) => {
      const calendarId = (): "online" | "offline" | "learn" => {
        if (item.teacher.startsWith("https://learn")) {
          return "learn";
        }

        if (item.location === "online") {
          return "online";
        }

        return "offline";
      };

      const newEvent = {
        id: item.id,
        title: item.courseName,
        description: `${item.teacher.startsWith("https://learn") ? "learn.astanait.edu.kz" : item.teacher}  |  ${item.location.toUpperCase()}  |  ${item.type}\n`,
      };

      const startBaseDate = getTargetDateByDay(item.start);
      const start = convertToDateTime(startBaseDate);
      const end = convertToDateTime(
        new Date(new Date(start).setMinutes(startBaseDate.getMinutes() + 50)),
      );

      return {
        ...newEvent,
        start: start,
        end: end,
        _customContent: {
          timeGrid: `<strong>
                      ${item.courseName.length > 30 ? item.courseName.slice(0, 26) + "..." : item.courseName}
                     </strong><br>
                     ${item.teacher}<br />
                     ${item.location.toUpperCase()}<br />`,
        },
        calendarId: calendarId(),
      };
    });

    return resultSchedule;
  });

  const valueCourses = computed(() => {
    if (!currentValue.value) {
      return [];
    }

    const scheduleData = schedule.value;

    if (!scheduleData) {
      return [];
    }

    const uniqueCourses = new Set(scheduleData.map((item) => item.courseName));

    return Array.from(uniqueCourses);
  });

  return {
    groupSchedule,
    allOptions,
    getTargetDateByDay,
    convertToDateTime,
    valueCourses: valueCourses,
  };
}
