FROM --platform=$BUILDPLATFORM node:22-alpine AS build-base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM build-base AS builder
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/telegram-bot/package.json ./apps/telegram-bot/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY . .
# `...` builds @heresy/shared first; its modules are bundled into dist.
RUN pnpm --filter @heresy/telegram-bot... build
RUN pnpm deploy --filter @heresy/telegram-bot --prod /app

FROM --platform=$TARGETPLATFORM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tzdata \
    && export TZ="Asia/Almaty" \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone
COPY --from=builder /app ./

ENV NODE_ENV=production

CMD ["node", "dist/index.mjs"]
