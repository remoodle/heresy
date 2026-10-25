import { InlineKeyboard } from "grammy";
import type { TelegramNotification } from "@heresy/shared/telegram-bot";
import { clearMessageCallback, roomPhotoCallback } from "../callback-data";
import { m } from "../i18n/messages.js";
import { getUniqueRooms } from "../rooms";
import { buildReminderMessage } from "./deadlines";
import { buildClassReminderMessage, buildTodayScheduleMessage } from "./schedule";

// Notifications stay in the chat, so each one carries a button to clear it.
export function renderNotification(notification: TelegramNotification["notification"]) {
  switch (notification.kind) {
    case "deadlines":
      return {
        text: buildReminderMessage(notification.events),
        keyboard: new InlineKeyboard().text(m.ui_clear(), clearMessageCallback),
      };
    case "digest":
      return {
        text: buildTodayScheduleMessage(notification.items, new Date()),
        keyboard: new InlineKeyboard().text(m.ui_close(), clearMessageCallback),
      };
    case "classes": {
      const keyboard = new InlineKeyboard();
      const rooms = getUniqueRooms(notification.items);

      for (let i = 0; i < rooms.length; i += 2) {
        for (const room of rooms.slice(i, i + 2)) {
          keyboard.text(m.ui_room_map({ room }), roomPhotoCallback.pack({ room }));
        }

        keyboard.row();
      }

      return {
        text: buildClassReminderMessage(notification.items, notification.minutesUntil),
        keyboard: keyboard.text(m.ui_close(), clearMessageCallback),
      };
    }
  }
}
