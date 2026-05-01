# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base
WORKDIR /app

# ── Install dependencies ───────────────────────────────────────────────────────
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ── Build / final image ────────────────────────────────────────────────────────
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Data directory for the SQLite file (mount a volume here in production)
RUN mkdir -p /data
ENV DB_PATH=/data/plant-care.db

EXPOSE 3000

# Runs migrations automatically then starts the server (see src/index.ts)
CMD ["bun", "run", "src/index.ts"]
