ARG NODE_VERSION=24-slim

FROM node:${NODE_VERSION} AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci --no-audit --no-fund

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
RUN npx prisma generate
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
