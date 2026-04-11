import { InlineKeyboard } from "grammy";
import {
  menuCallback,
  settingsCallback,
  deadlinesCallback,
  scheduleCallback,
} from "../callback-data";

const CALENDAR_URL = "https://calendar.remoodle.app/account";

export function buildMenuKeyboard() {
  return new InlineKeyboard()
    .text("📅 Deadlines", deadlinesCallback.pack({}))
    .text("📆 Schedule", scheduleCallback.pack({}))
    .row()
    .text("⚙️ Settings", settingsCallback.pack({}))
    .row()
    .url("🌐 Calendar", CALENDAR_URL);
}

export function buildBackToMenuKeyboard() {
  return new InlineKeyboard().text("Back ←", menuCallback.pack({}));
}
