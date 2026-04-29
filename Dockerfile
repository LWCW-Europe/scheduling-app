FROM oven/bun:1-debian AS deps
WORKDIR /app
# Build tools required for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-debian AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Pass git commit hash via --build-arg COMMIT_HASH=$(git rev-parse --short HEAD)
ARG COMMIT_HASH
ENV VERCEL_GIT_COMMIT_SHA=$COMMIT_HASH
RUN bun run build

FROM oven/bun:1-debian AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/data.db

CMD ["bun", "node_modules/next/dist/bin/next", "start"]
