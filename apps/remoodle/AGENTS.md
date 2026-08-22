## ReMoodle Notes

- ReMoodle is a Telegram bot plus Hatchet worker.
- Bot handlers live in `src/bot/features/`.
- Shared formatting and domain logic live in `src/library/`.
- Background jobs live in `src/worker/workflows/`.

## Messages

- ReMoodle uses Paraglide for user-facing messages.
- Add or edit messages in `messages/en.json`.
- Do not manually edit generated files in `src/library/i18n/`.
- Keep translation messages plain when possible. Do not inline Telegram HTML in message values unless there is a strong reason.
- Apply Telegram formatting in app code with helpers from `src/library/telegram-html.ts`.
- `dev`, `test`, `type-check`, and `build` already compile Paraglide first.

## Minimal Flow

- Change app logic in the feature or library file that owns the behavior.
- If user-facing text changes, update `messages/en.json` and keep formatting in code.
- Validate with `vp run @heresy/remoodle#type-check`, `vp run @heresy/remoodle#test`, and `vp run @heresy/remoodle#build`.

<!-- hatchet-skills:start -->

## Hatchet Agent Skills

Hatchet agent skills are installed in `skills/hatchet-cli/`. When working with this project's Hatchet workflows, read the relevant reference:

- **Setup CLI**: `skills/hatchet-cli/references/setup-cli.md`
- **Start worker**: `skills/hatchet-cli/references/start-worker.md`
- **Trigger & watch**: `skills/hatchet-cli/references/trigger-and-watch.md`
- **Debug a run**: `skills/hatchet-cli/references/debug-run.md`
- **Replay a run**: `skills/hatchet-cli/references/replay-run.md`

Full skill: `skills/hatchet-cli/SKILL.md`

<!-- hatchet-skills:end -->
