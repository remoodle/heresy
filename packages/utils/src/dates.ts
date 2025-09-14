import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export const getTimeLeft = (date: number) => {
  const currentTime = dayjs();
  const deadlineTime = dayjs(date);

  const duration = dayjs.duration(deadlineTime.diff(currentTime));

  const months = duration.months();
  const days = duration.days();
  const hours = String(duration.hours()).padStart(2, "0");
  const minutes = String(duration.minutes()).padStart(2, "0");
  const seconds = String(duration.seconds()).padStart(2, "0");

  const parts = [];

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  parts.push(`${hours}:${minutes}:${seconds}`);

  return parts.join(", ");
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const durationToMs = (value: string): number => {
  return dayjs.duration(value).asMilliseconds();
};

export const toISO8601Duration = (ms: number): string => {
  return dayjs.duration(ms, "milliseconds").toISOString();
};

export const humanizeDuration = (value: string): string => {
  return dayjs.duration(value).humanize();
};
