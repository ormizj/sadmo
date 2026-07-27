ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund

# One-shot stage that applies migrations and seeds the DB before the app starts.
# `deps` installed devDeps (prisma CLI + tsx), so no extra install is needed; the
# Prisma client is generated here because the seed imports @prisma/client.
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# generate never connects to the DB, but Prisma 7's config resolves env("DATABASE_URL")
# eagerly on load — supply a throwaway URL so the config loads at build time.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM base AS dev
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client before building so the app's imports resolve.
# Prisma 7 uses the pg driver adapter + query compiler, so there is no separate
# query-engine binary to ship — the generated client in node_modules is enough
# and gets traced into .next/standalone.
# generate never connects to the DB, but Prisma 7's config resolves env("DATABASE_URL")
# eagerly on load — supply a throwaway URL so the config loads at build time.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN --mount=type=cache,target=/app/.next/cache \
  npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/messages ./messages
RUN mkdir .next && chown node:node .next
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
