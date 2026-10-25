// Contracts between the server, which links to and messages through the bot, and the bot itself.

// `/start` payloads. The web calendar sends users to the bot for everything it cannot do itself.
export const START_PAYLOADS = { myDu: "my_du", moodle: "moodle", loginPrefix: "login_" } as const;

// Attached to notifications the worker sends; the bot deletes the message when it is pressed.
export const CLEAR_MESSAGE_CALLBACK = "remove_message";

// The worker builds these buttons without grammY, so both sides share the plain format.
export function roomPhotoCallbackData(room: string) {
  return `room_photo:${room}`;
}

export const ROOM_PHOTO_CALLBACK_PATTERN = /^room_photo:(.+)$/;
