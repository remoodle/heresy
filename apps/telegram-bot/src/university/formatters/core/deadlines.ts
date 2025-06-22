import type { MoodleEvent } from "@remoodle/types";
import { formatTimestamp, getTimeLeft } from "@remoodle/utils";

export interface DeadlineFormatOptions {
  getCourseName?: (event: MoodleEvent) => string;
  getDeadlineName?: (event: MoodleEvent) => string;
  getFireIcon?: (hoursLeft: number, threshold: number) => string;
  fireThresholdHours?: number;
}

export const formatDeadlineItem = (
  deadline: MoodleEvent,
  options: DeadlineFormatOptions = {},
): string => {
  const {
    getCourseName = (event) => event.course.shortname,
    getDeadlineName = (event) => event.name,
    getFireIcon = (hours, threshold) => (hours <= threshold ? "🔥" : "📅"),
    fireThresholdHours = 3,
  } = options;

  deadline.timestart *= 1000;
  const timeleft = deadline.timestart - Date.now();
  const hoursLeft = timeleft / (60 * 60 * 1000);

  const icon = getFireIcon(hoursLeft, fireThresholdHours);
  const courseName = getCourseName(deadline);
  const deadlineName = getDeadlineName(deadline);
  const date = formatTimestamp(deadline.timestart);
  const timeLeft = getTimeLeft(deadline.timestart);

  return `${icon}  <b>${deadlineName}</b>  |  ${courseName}  |  Date → ${date}  |  Time left → <b>${timeLeft}</b>`;
};

export const formatDeadlinesList = (
  deadlines: MoodleEvent[],
  short: boolean = false,
  options: DeadlineFormatOptions = {},
): string => {
  if (!deadlines.length) {
    return `You have no upcoming deadlines${short ? " in the next 2 days" : ""} 🥰`;
  }

  const deadlineItems = deadlines.map((deadline) =>
    formatDeadlineItem(deadline, options),
  );

  return "Upcoming deadlines:\n\n" + deadlineItems.join("\n\n");
};
