# TODOs — Schedule / Calendar restart plan

## Product

These features are for:

- `apps/remoodle` — Telegram bot
- `apps/calendar` — `calendar.remoodle.app`

## Direction

Start over with a smaller scope and treat **schedule** as the main thing first.

- Bot: better schedule view + schedule notification rules
- Calendar app: correct iCal export + custom events on top of the uni schedule
- Keep **deadline thresholds** and **schedule thresholds** separate

## Bot (`apps/remoodle`)

### P0

- [x] Merge schedule events better, more like a calendar.
  - [x] Do this by default in the bot, while keeping a user setting to turn it off.
- [ ] Define how merged schedule events are identified, so notification rules can attach to them.

### P1

- [ ] Create notification rules for schedule events.
- [ ] Store schedule notification settings in the Remoodle DB.
- [ ] Support custom reminder offsets in minutes.
- [ ] Keep schedule thresholds separate from deadline thresholds.
- [ ] Allow per-user schedule notification settings without affecting deadline reminder settings.

## Calendar (`apps/calendar`)

### P0

- [x] Fix iCal export to use proper `RRULE` recurrence instead of duplicating copied events.

### P1

- [ ] Allow users to add custom events to their schedule.
- [ ] Treat the uni schedule as one base schedule/calendar.
- [ ] Merge custom events with the base schedule in the UI.
- [ ] Include custom events in export later if needed.
- [ ] Keep custom events simple first: title, day/time, recurrence, optional notes.

## Data / architecture notes

- [ ] Keep notification settings in `apps/remoodle`.
- [ ] Keep schedule/custom event rendering and iCal export logic in `apps/calendar`.
- [ ] Ensure stable IDs/keys exist so bot notification rules can reference schedule events reliably.

## Open questions

- [ ] What exactly counts as a merged schedule event in the bot?
- [ ] Should notification rules attach to a merged event pattern or a concrete occurrence?
- [ ] Should custom events added in Calendar also become notifiable in the bot later?
