# heresy

A Vite+ monorepo.

## Workspace

The active workspace includes `apps/*` and `docs`. `contrib`, `junk`, and `tools` are intentionally left outside the workspace.

In particular:

- `docs` is managed by pnpm as part of the workspace.
- `contrib/aitumap` remains a standalone project outside the workspace.

## Commands

- `vp install`
- `vp run ready`
- `vp run dev`
- `vp run dev:calendar`
- `vp run dev:remoodle`
