import type { BotCommand } from "grammy/types";

export const BOT_COMMANDS: BotCommand[] = [
  { command: "start", description: "open menu" },
  { command: "deadlines", description: "show deadlines" },
  { command: "ds", description: "show deadlines (2 days)" },
  { command: "d", description: "show deadlines" },
  { command: "today", description: "show today's schedule" },
  { command: "schedule", description: "show next week's schedule" },
  { command: "settings", description: "open settings" },
  { command: "update", description: "update Moodle calendar URL" },
];
