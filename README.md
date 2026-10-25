# heresy

A Vite+ monorepo.

- `apps/server`: the API and the Hatchet worker, sharing one database. `src/bin.ts <api|worker>` starts either.
- `apps/telegram-bot`: the Telegram bot, a client of the server's API.
- `apps/calendar`: the web calendar, a client of the server's API.
- `packages/shared`: pure modules, message texts, and the bot's contracts with the worker.

## Commands

- `vp install`
- `vp run ready`
- `vp run dev`
- `vp run dev:calendar`
- `vp run dev:server`
- `vp run dev:telegram-bot`
