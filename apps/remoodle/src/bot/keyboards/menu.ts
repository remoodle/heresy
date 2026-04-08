import { InlineKeyboard } from "grammy";
import { menuCallback, settingsCallback, deadlinesCallback } from "../callback-data";

const CALENDAR_URL = "https://calendar.remoodle.app/";

export function buildMenuKeyboard() {
  return new InlineKeyboard()
    .text("Deadlines", deadlinesCallback.pack({}))
    .row()
    .text("⚙️ Settings", settingsCallback.pack({}))
    .row()
    .url("🌐 Calendar", CALENDAR_URL);
}

export function buildBackToMenuKeyboard() {
  return new InlineKeyboard().text("Back ←", menuCallback.pack({}));
}
