import { InlineKeyboard } from "grammy";
import { config } from "../../config";
import {
  aboutCallback,
  menuCallback,
  settingsCallback,
  deadlinesCallback,
  scheduleCallback,
} from "../callback-data";

export function buildMenuKeyboard() {
  return new InlineKeyboard()
    .text("📋 Deadlines", deadlinesCallback.pack({}))
    .text("📆 Schedule", scheduleCallback.pack({}))
    .row()
    .text("Settings", settingsCallback.pack({}))
    .text("About", aboutCallback.pack({}))
    .row()
    .webApp("Map", config.aitumap.url)
    .url("Calendar", config.calendar.accountUrl);
}

export function buildBackToMenuKeyboard() {
  return new InlineKeyboard().text("Back ←", menuCallback.pack({}));
}
