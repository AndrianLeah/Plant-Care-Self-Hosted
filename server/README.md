# Plant Care — Backend Server

Hono + Bun + Drizzle ORM + SQLite backend for the Plant Care app.

## Requirements

- [Bun](https://bun.sh) ≥ 1.1

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env — JWT_SECRET, JWT_REFRESH_SECRET and ADMIN_SECRET are required.
# Generate them with: openssl rand -base64 32

# 3. Seed DB with species, images, translations and water presets
#    (migrations are applied automatically on first start)
bun run db:seed

# 4. Start development server (restarts on file changes)
bun run dev
```

> **Note:** migrations are applied automatically every time the server starts,
> so you never need to run `db:migrate` manually.

The server starts on `http://localhost:3000` by default (configurable via `PORT` in `.env`).

## Production deploy with Docker

```bash
# 1. Build the image
docker build -t plant-care-server .

# 2. Create a persistent volume for the SQLite database
docker volume create plant-care-db

# 3. Run (replace the secret values with strong random strings)
docker run -d \
  --name plant-care-server \
  -p 3000:3000 \
  -v plant-care-db:/data \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -e JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  -e ADMIN_SECRET="$(openssl rand -base64 32)" \
  -e CORS_ORIGIN="https://yourdomain.com" \
  plant-care-server

# 4. Seed species data (first deploy only)
docker exec plant-care-server bun run db:seed
```

The container applies migrations automatically on startup, so upgrades are just:
```bash
docker pull plant-care-server   # or rebuild
docker restart plant-care-server
```

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start with `--watch` (auto-restart) |
| `bun run start` | Start without watch |
| `bun run db:generate` | Generate Drizzle migration SQL from schema changes |
| `bun run db:migrate` | Apply pending migrations (also runs automatically on startup) |
| `bun run db:seed` | Seed species, images, translations and water presets from `server/data/` |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `./plant-care.db` | Path to the SQLite database file |
| `JWT_SECRET` | **required** | Secret for signing access tokens (15 min expiry) |
| `JWT_REFRESH_SECRET` | **required** | Secret for signing refresh tokens (7 day expiry) |
| `ADMIN_SECRET` | **required** | Value expected in the `X-Admin-Secret` header for admin routes |
| `CORS_ORIGIN` | `http://localhost:1420` | Comma-separated list of allowed CORS origins |

Generate strong secrets with:
```bash
openssl rand -base64 32
```

## API reference

### Auth

> Login and register are rate-limited to 10 requests per 15 minutes per IP.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account → returns token pair |
| `POST` | `/auth/login` | — | Login → returns token pair |
| `POST` | `/auth/refresh` | — | Rotate refresh token → new token pair |
| `POST` | `/auth/logout` | Bearer | Revoke refresh token |

### User

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/user/me` | Bearer | Get profile (name, lang, waterProfile) |
| `PATCH` | `/user/me` | Bearer | Update name, lang, and/or waterProfile |
| `PATCH` | `/user/me/credentials` | Bearer | Change email and/or password (requires `currentPassword`) |

### Plants

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/plants` | Bearer | List all user plants with logs |
| `POST` | `/plants` | Bearer | Add a plant |
| `PATCH` | `/plants/:id` | Bearer | Update a plant |
| `DELETE` | `/plants/:id` | Bearer | Delete a plant |
| `POST` | `/plants/:id/moisture` | Bearer | Log a moisture reading |
| `POST` | `/plants/:id/watering` | Bearer | Log a watering event |
| `GET` | `/plants/:id/photo` | Bearer | Get plant photo (binary) |
| `PUT` | `/plants/:id/photo` | Bearer | Upload/replace plant photo (`multipart/form-data`, field: `photo`, max 5 MB) |
| `DELETE` | `/plants/:id/photo` | Bearer | Delete plant photo |

### Catalog (public)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/catalog?lang=en` | — | List all species with translations (`lang` defaults to `en`) |
| `GET` | `/catalog/:id/image` | — | Get species image (binary, `Cache-Control: immutable`) |

### Water presets (public)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/water-presets` | — | List all Italian city water presets |

### Admin

All admin routes require the `X-Admin-Secret` header.

| Method | Path | Description |
|---|---|---|
| `POST` | `/admin/catalog` | Add a new species |
| `PATCH` | `/admin/catalog/:id` | Update species fields |
| `DELETE` | `/admin/catalog/:id` | Delete a species |
| `PUT` | `/admin/catalog/:id/image` | Upload species image (`multipart/form-data`, field: `image`) |
| `PUT` | `/admin/catalog/:id/translations/:lang` | Upsert a translation |
| `DELETE` | `/admin/catalog/:id/translations/:lang` | Delete a translation |
| `POST` | `/admin/water-presets` | Add a water preset |
| `PATCH` | `/admin/water-presets/:id` | Update a water preset |
| `DELETE` | `/admin/water-presets/:id` | Delete a water preset |

## Project structure

```
server/
├── data/
│   ├── compressed/       Species images (WebP/JPEG) — read by seed script
│   ├── originals/        Original high-res images — gitignored
│   ├── species.json      Species data
│   ├── translations.json Species translations (en, it)
│   └── water-presets.json Italian city water profiles
├── drizzle/              Generated migration SQL files (committed)
├── scripts/
│   └── seed.ts           Seed script — reads from server/data/
└── src/
    ├── index.ts          App entry point, middleware, route mounting
    ├── db/
    │   ├── schema.ts     Drizzle table definitions
    │   ├── client.ts     SQLite connection (WAL mode, FK enforcement)
    │   └── migrate.ts    Migration runner
    ├── lib/
    │   └── jwt.ts        Access + refresh token helpers (jose)
    ├── middleware/
    │   ├── auth.ts       requireAuth — validates Bearer access token
    │   └── admin.ts      requireAdmin — validates X-Admin-Secret header
    └── routes/
        ├── auth.ts
        ├── user.ts
        ├── plants.ts
        ├── catalog.ts
        ├── waterPresets.ts
        └── admin.ts
```

## Adding a new species

1. Place the original image in `server/data/originals/` and run `npm run optimize-images` from the project root to compress it into `server/data/compressed/`.
2. Use the admin API to insert the species and upload the image:
   ```bash
   # Add species metadata
   curl -X POST http://localhost:3000/admin/catalog \
     -H "X-Admin-Secret: <secret>" \
     -H "Content-Type: application/json" \
     -d '{...}'

   # Upload image
   curl -X PUT http://localhost:3000/admin/catalog/<id>/image \
     -H "X-Admin-Secret: <secret>" \
     -F "image=@server/data/compressed/<id>.jpg"
   ```
3. Add translations via `PUT /admin/catalog/:id/translations/en` and `/it`.

