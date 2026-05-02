# syntax=docker/dockerfile:1

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/plant-care.db

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY data ./data

# SQLite database directory for mounted runtime data.
RUN mkdir -p /data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

# Migrations run automatically during app startup in src/index.ts.
CMD ["bun", "run", "start"]
