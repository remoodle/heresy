import { InlineKeyboard } from "grammy";
import { config } from "../../config";
import { getMiniAppUrl } from "../helpers/get-mini-app-url";

export const createMenuKeyboard = async (userId: number, userName: string) => {
  const url = await getMiniAppUrl(userId, config.frontend.url);

  const keyboard = new InlineKeyboard()
    .text("Deadlines", "deadlines")
    .row()
    .text("Courses", "courses")
    .row()
    .webApp("Map", "https://aitumap.remoodle.app")
    .webApp("Schedule", "https://calendar.remoodle.app")
    .row()
    .text("⚙️", "settings")
    .text("About", "about")
    .row()
    .webApp("🌐 Website", url);

  return {
    text: `👋 ${userName}`,
    keyboard,
  };
};

export const createBackToMenuKeyboard = () => {
  return new InlineKeyboard().text("Back ←", "back_to_menu");
};
