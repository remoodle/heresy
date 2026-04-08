import type { MoodleEvent } from "../../../types/moodle";
import { formatDate, getTimeLeft } from "../../utils";

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

  const timestartMs = deadline.timestart * 1000;
  const timeleft = timestartMs - Date.now();
  const hoursLeft = timeleft / (60 * 60 * 1000);

  const icon = getFireIcon(hoursLeft, fireThresholdHours);
  const courseName = getCourseName(deadline);
  const deadlineName = getDeadlineName(deadline);
  const date = formatDate(timestartMs);
  const timeLeft = getTimeLeft(timestartMs);

  return `${icon}  <b>${deadlineName}</b>  |  ${courseName}  |  Date → ${date}  |  Time left → <b>${timeLeft}</b>`;
};

export const formatDeadlinesList = (
  deadlines: MoodleEvent[],
  short: false | number,
  options: DeadlineFormatOptions = {},
): string => {
  if (!deadlines.length) {
    return `You have no upcoming deadlines${short !== false ? ` in the next ${short} days` : ""} 🥰`;
  }

  const deadlineItems = deadlines.map((deadline) =>
    formatDeadlineItem(deadline, options),
  );

  return "Upcoming deadlines:\n\n" + deadlineItems.join("\n\n");
};
