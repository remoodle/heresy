import { InlineKeyboard } from "grammy";
import { config } from "../../config";
import { getMiniAppUrl } from "../helpers/get-mini-app-url";

export const keyboards = {
  main: new InlineKeyboard()
    .text("Deadlines", "deadlines")
    .row()
    .text("Courses", "courses")
    .row()
    .webApp("Map", "https://aitumap.remoodle.app")
    .webApp("Schedule", "https://calendar.remoodle.app")
    .row()
    .text("⚙️", "settings")
    .text("About", "others")
    .row(),

  deadlines: new InlineKeyboard()
    .text("Back ←", "back_to_menu")
    .text("Refresh", "refresh_deadlines_menu"),

  singleDeadline: new InlineKeyboard().text(
    "Refresh",
    "refresh_deadlines_single",
  ),

  others: new InlineKeyboard().text("Back ←", "back_to_menu"),

  deleteProfile: new InlineKeyboard()
    .text("Yes", "delete_profile_yes")
    .text("Cancel", "account"),

  settings: new InlineKeyboard()
    .text("Notifications", "notifications")
    .text("Account", "account")
    .row()
    .text("Back ←", "back_to_menu"),

  account: new InlineKeyboard()
    .text("⚠️ Delete Profile ⚠️", "delete_profile")
    .row()
    .text("Back ←", "settings"),

  findToken: new InlineKeyboard().url(
    "How to find your token",
    "https://ext.remoodle.app/find-token",
  ),

  // Utility buttons
  backToMenu: new InlineKeyboard().text("Main Menu", "back_to_menu"),

  clearMessage: new InlineKeyboard().text("Clear", "remove_message"),
};

export const createMainKeyboard = async (userId: number, userName: string) => {
  const url = await getMiniAppUrl(userId, config.frontend.url);

  const keyboard = keyboards.main.clone().webApp("🌐 Website", url);

  return {
    text: `👋 ${userName}`,
    keyboard,
  };
};
