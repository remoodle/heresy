# heresy

A Vite+ monorepo.

- `apps/server`: the API and the Hatchet worker, sharing one database. `src/bin.ts <api|worker>` starts either.
- `apps/telegram-bot`: the Telegram bot, a client of the server's API. It owns every user-facing text, including the notifications the worker hands it through Hatchet.
- `apps/calendar`: the web calendar, a client of the server's API.
- `packages/shared`: translation-free modules shared by the apps, and the server-bot contracts.

## Commands

- `vp install`
- `vp run ready`
- `vp run dev`
- `vp run dev:calendar`
- `vp run dev:server`
- `vp run dev:telegram-bot`
