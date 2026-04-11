import { InlineKeyboard } from "grammy";
import {
  aboutCallback,
  menuCallback,
  settingsCallback,
  deadlinesCallback,
  scheduleCallback,
} from "../callback-data";

const CALENDAR_URL = "https://calendar.remoodle.app/account";
const MAP_URL = "https://aitumap.remoodle.app/";

export function buildMenuKeyboard() {
  return new InlineKeyboard()
    .text("📋 Deadlines", deadlinesCallback.pack({}))
    .text("📆 Schedule", scheduleCallback.pack({}))
    .row()
    .text("Settings", settingsCallback.pack({}))
    .text("About", aboutCallback.pack({}))
    .row()
    .webApp("Map", MAP_URL)
    .url("Calendar", CALENDAR_URL);
}

export function buildBackToMenuKeyboard() {
  return new InlineKeyboard().text("Back ←", menuCallback.pack({}));
}
