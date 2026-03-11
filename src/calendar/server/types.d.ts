type GroupScheduleItem = {
  id: string;
  start: string;
  end: string;
  courseName: string;
  location: string;
  isOnline: boolean;
  teacher: string;
  type: "lecture" | "practice";
};

export type ScheduleFilter = {
  eventTypes: {
    lecture: boolean;
    practice: boolean;
    learn: boolean;
  };
  eventFormats: {
    online: boolean;
    offline: boolean;
  };
  excludedCourses: string[];
  ical?: {
    combineAdjacentPairs?: boolean;
  };
};

type GroupSchedule = GroupScheduleItem[];

export type ScheduleData = {
  [group: string]: GroupSchedule;
};
