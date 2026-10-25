import { describe, expect, test } from "vite-plus/test";
import { renderNotification } from "./notification";

const lecture = {
  id: "1",
  start: "2026-04-08 10:00",
  end: "2026-04-08 10:50",
  courseName: "Computer Networks",
  location: "C1.2.240",
  isOnline: false,
  teacher: "A. Teacher",
  type: "lecture" as const,
  lessonType: "Lecture",
};

describe("renderNotification", () => {
  test("class reminders get a map button per room before the close button", () => {
    const online = { ...lecture, id: "2", location: "Teams", isOnline: true };

    const { text, keyboard } = renderNotification({
      kind: "classes",
      minutesUntil: 15,
      items: [lecture, online],
    });

    expect(text).toContain("Computer Networks");
    expect(keyboard.inline_keyboard.map((row) => row.map((button) => button.text))).toStrictEqual([
      ["Map: C1.2.240"],
      ["Close"],
    ]);
  });
});
