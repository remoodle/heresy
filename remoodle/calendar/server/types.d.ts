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

type GroupSchedule = GroupScheduleItem[];

export type ScheduleData = {
  lessonsByGroupname: { [group: string]: GroupSchedule };
  lessonsByLocation: { [location: string]: GroupSchedule };
  lessonsByTeacher: { [teacher: string]: GroupSchedule };
};
