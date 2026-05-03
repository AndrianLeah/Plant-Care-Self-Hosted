# Plant Care Backend Server

Hono + Bun + SQLite API for the Plant Care app.

This README reflects the backend as it is currently implemented in `server/`.

## What This Service Does

- JWT auth with access tokens and refresh-token rotation
- User profile endpoints
- User plant CRUD
- Moisture logs, watering history, and plant photo storage
- Public species catalog with translated content and binary images
- Public water-preset endpoint
- Admin endpoints for catalog, translations, images, and water presets
- Proxied `sqlite-gui-node` interface at `/admin/db/*` (session-bootstrapped)

## Runtime Behavior

On every server start:

- Drizzle migrations are applied automatically from `server/drizzle/`
- expired refresh tokens are purged once at boot and then every 6 hours
- CORS is enabled from `CORS_ORIGIN`
- secure headers and request logging are enabled

Database connection behavior:

- SQLite
- `PRAGMA journal_mode = WAL`
- `PRAGMA foreign_keys = ON`
- `PRAGMA synchronous = NORMAL`

Health endpoint:

- `GET /health` -> `{ "status": "ok" }`

## Requirements

- [Bun](https://bun.sh) `1.1+`

## Environment Variables

Use [`server/.env.example`](.env.example) as the template.
This file is for backend runtime only. Frontend build configuration belongs in the repository-root `.env`.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_PATH` | `./plant-care.db` | SQLite database file path |
| `JWT_SECRET` | required | HS256 secret for 15-minute access tokens |
| `JWT_REFRESH_SECRET` | required | HS256 secret for 7-day refresh tokens |
| `ADMIN_SECRET` | required | Value required in the `X-Admin-Secret` header |
| `SQLITE_GUI_PORT` | `3011` | Internal port for `sqlite-gui-node` (proxied through `/admin/db/*`) |
| `CORS_ORIGIN` | `http://localhost:1420` | Comma-separated allowed origins |

Notes:

- The server will refuse to start without `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- In the Docker image, `DB_PATH` is overridden to `/data/plant-care.db`.
- `CORS_ORIGIN` accepts multiple origins separated by commas.

Generate strong secrets with:

```bash
openssl rand -base64 32
```

## Local Development

From `server/`:

```bash
bun install
cp .env.example .env
bun run dev
```

The API starts on `http://localhost:3000` by default.

Notes:

- `bun run dev` now runs migrations, seeds the local database, and then starts the watch server.
- `bun run dev` restarts on file changes.
- `bun run dev:watch` starts only the watch server if you want to skip the bootstrap step.
- `bun run start` runs the same app without watch mode.
- Migrations also run automatically during normal startup, so `bun run db:migrate` is optional for day-to-day development.
- `bun run db:seed` is safe to rerun manually.

## Seed Data

The checked-in seed data currently contains:

- `38` species
- `38` catalog images in `server/data/compressed/*.webp`
- `76` translations (`38` English, `38` Italian)
- `107` water presets

The seed script reads:

- `server/data/species.json`
- `server/data/translations.json`
- `server/data/water-presets.json`
- `server/data/compressed/*.webp`

Important seed caveats:

- Species, translations, and species images are upserted.
- Water presets still do not have a database-level uniqueness constraint, but the seed script removes exact duplicates and skips presets that already match the checked-in seed data.
- The seed script imports only `.webp` images from `server/data/compressed/`.

## Docker

Build the API image from `server/`:

```bash
docker build -t plant-care-server .
```

Run it with a persistent volume for SQLite:

```bash
docker volume create plant-care-db

docker run -d \
  --name plant-care-server \
  -p 3000:3000 \
  -v plant-care-db:/data \
  -e JWT_SECRET="$(openssl rand -base64 32)" \
  -e JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
  -e ADMIN_SECRET="$(openssl rand -base64 32)" \
  -e CORS_ORIGIN="https://yourdomain.com" \
  plant-care-server
```

First deployment still needs a manual seed:

```bash
docker exec plant-care-server bun run db:seed
```

Notes:

- Migrations run automatically when the container starts.
- The image does not seed automatically.
- The top-level `docker-compose.yml` uses root `.env` for the frontend build URL and `server/.env` for backend runtime variables.

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Apply migrations, seed the local database, and start the API with `--watch` |
| `bun run dev:watch` | Start the API with `--watch` only |
| `bun run start` | Start without watch |
| `bun run db:generate` | Generate Drizzle migration SQL from schema changes |
| `bun run db:migrate` | Apply pending migrations manually |
| `bun run db:seed` | Seed species, images, translations, and water presets |

## Data Model

Main tables:

- `users`
- `refresh_tokens`
- `species`
- `species_translations`
- `species_images`
- `water_presets`
- `plants`
- `plant_photos`
- `moisture_logs`
- `watering_dates`

Binary images are stored inside SQLite:

- catalog images in `species_images`
- user plant photos in `plant_photos`

## API Reference

### Auth

Login and register are rate-limited in memory to `10 requests / 15 minutes / IP`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/auth/register` | — | Body: `email`, `password >= 8`, optional `name` |
| `POST` | `/auth/login` | — | Body: `email`, `password` |
| `POST` | `/auth/refresh` | — | Body: `{ "refreshToken": "..." }` |
| `POST` | `/auth/logout` | Bearer | Body: `{ "refreshToken": "..." }`; revokes that refresh token if valid |

### User

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/user/me` | Bearer | Returns `id`, `email`, `name`, `lang`, `waterProfile` |
| `PATCH` | `/user/me` | Bearer | Supports `name`, `lang`, `waterProfile` |
| `PATCH` | `/user/me/credentials` | Bearer | Requires `currentPassword` and at least one of `newEmail`, `newPassword` |

### Plants

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/plants` | Bearer | Returns all plants for the current user, including logs and `hasPhoto` |
| `DELETE` | `/plants` | Bearer | Deletes all plants for the current user (used by full-restore import flow) |
| `POST` | `/plants` | Bearer | Body: `speciesId`, `nickname`, optional `location`, `notes`, `photoUrl`, `addedDate` |
| `PATCH` | `/plants/:id` | Bearer | Partial update of plant fields |
| `DELETE` | `/plants/:id` | Bearer | Deletes the plant and cascaded child rows |
| `POST` | `/plants/:id/moisture` | Bearer | Body: `level`, optional `note`, optional `date` as ISO datetime |
| `POST` | `/plants/:id/watering` | Bearer | Optional body field `date` as ISO datetime |
| `GET` | `/plants/:id/photo` | Bearer | Returns binary photo if present |
| `PUT` | `/plants/:id/photo` | Bearer | `multipart/form-data`, field `photo`, types `jpeg/png/webp`, max `5 MB` |
| `DELETE` | `/plants/:id/photo` | Bearer | Deletes custom plant photo |

### Catalog

Public endpoints.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/catalog?lang=en` | — | Supported langs: `en`, `it`; unsupported values fall back to `en` |
| `GET` | `/catalog/:id/image` | — | Returns binary catalog image |

Cache behavior:

- `/catalog` responses: `Cache-Control: public, max-age=3600`
- `/catalog/:id/image`: `Cache-Control: public, max-age=604800, immutable`

### Water Presets

Public endpoint.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/water-presets` | — | Returns preset values without database IDs |

Cache behavior:

- `/water-presets`: `Cache-Control: public, max-age=86400`

### Admin

Catalog and preset admin routes require:

- header `X-Admin-Secret: <ADMIN_SECRET>`

| Method | Path | Notes |
|---|---|---|
| `POST` | `/admin/db/session` | Requires `X-Admin-Secret`; creates signed session cookie for DB GUI |
| `DELETE` | `/admin/db/session` | Requires `X-Admin-Secret`; clears DB GUI session cookie |
| `GET/POST/...` | `/admin/db/*` | Proxied `sqlite-gui-node` interface (full DB admin capabilities) |
| `POST` | `/admin/catalog` | Create species metadata |
| `PATCH` | `/admin/catalog/:id` | Update species metadata |
| `DELETE` | `/admin/catalog/:id` | Delete species |
| `PUT` | `/admin/catalog/:id/image` | `multipart/form-data`, field `image`, types `webp/png/jpeg` |
| `PUT` | `/admin/catalog/:id/translations/:lang` | Upsert translation row |
| `DELETE` | `/admin/catalog/:id/translations/:lang` | Delete translation row |
| `POST` | `/admin/water-presets` | Create preset; response includes new numeric ID |
| `PATCH` | `/admin/water-presets/:id` | Partial update |
| `DELETE` | `/admin/water-presets/:id` | Delete preset |

## Adding or Updating Catalog Content

You currently have two practical paths:

### 1. Use the admin API

This is the most direct and format-flexible path.

1. Create or update the species metadata with `/admin/catalog`.
2. Upload an image with `/admin/catalog/:id/image`.
3. Upsert translations with `/admin/catalog/:id/translations/:lang`.

### 2. Seed from files

If you want the content committed in the repository:

1. Add or edit rows in:
   - `server/data/species.json`
   - `server/data/translations.json`
2. Place the catalog image in `server/data/compressed/` as:
   - `<species-id>.webp`
3. Run:

```bash
bun run db:seed
```

Important:

- The root image helper `npm run optimize-images` writes `.webp` files to `server/data/compressed/`.
- The seed script reads `.webp` from that same directory.
- The optimization and seeding formats are aligned.

## Project Structure

```text
server/
├── data/
│   ├── compressed/         Seeded catalog images read by the seed script
│   ├── species.json        Species metadata
│   ├── translations.json  English and Italian species text
│   └── water-presets.json Water presets
├── drizzle/                SQL migrations
├── scripts/
│   └── seed.ts             Seed loader
└── src/
    ├── index.ts            Startup, middleware, route mounting
    ├── db/
    │   ├── client.ts       SQLite connection and pragmas
    │   ├── migrate.ts      Manual migration runner
    │   └── schema.ts       Drizzle schema
    ├── lib/
    │   ├── jwt.ts          Token helpers
    │   └── rateLimit.ts    In-memory IP rate limiter
    ├── middleware/
    │   ├── admin.ts        X-Admin-Secret validation
    │   └── auth.ts         Bearer token validation
    └── routes/
        ├── admin.ts
        ├── auth.ts
        ├── catalog.ts
        ├── plants.ts
        ├── user.ts
        └── waterPresets.ts
```
