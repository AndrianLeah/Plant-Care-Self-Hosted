# Plant Care Self-Hosted

<p align="center">
  <img src="public/app-icon.svg" width="96" height="96" alt="Plant Care Self-Hosted icon" />
</p>

A full-stack app for tracking and caring for your houseplants, built with Vue 3, Tauri, and a Hono + Bun backend.

## Features

- **Plant collection** — add plants from a catalog of 40+ species, give them a nickname, location, and custom photo
- **Plant photos** — upload a photo per plant (auto-compressed to 900×675 JPEG client-side before upload)
- **Watering log** — log waterings and see a chart of your history; get an estimated next-watering date
- **Moisture log** — track soil moisture level over time with per-species guidance
- **Species catalog** — browse all species with photos, care details, light and water requirements; images load lazily as you scroll
- **Water quality guide** — configure your local tap water profile and get per-plant compatibility advice
- **Auth** — account-based with JWT access tokens (15 min) + refresh tokens (7 days)
- **Bilingual** — English and Italian interface
- **Dark-friendly** — glassmorphism UI that adapts to the OS theme

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [Vue 3](https://vuejs.org/) + TypeScript |
| Build | [Vite](https://vitejs.dev/) |
| Desktop shell | [Tauri v2](https://tauri.app/) (Rust) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| State | [Pinia](https://pinia.vuejs.org/) |
| Routing | [Vue Router](https://router.vuejs.org/) |
| i18n | [Vue I18n](https://vue-i18n.intlify.dev/) |
| Charts | [Chart.js](https://www.chartjs.org/) + [vue-chartjs](https://vue-chartjs.org/) |
| Backend | [Hono](https://hono.dev/) + [Bun](https://bun.sh/) |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team/) |

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh) ≥ 1.1 (for the backend)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri desktop builds)
- [Tauri system dependencies](https://tauri.app/start/prerequisites/) for your OS

## Getting Started

### 1. Backend

See [server/README.md](server/README.md) for full setup instructions.

```bash
cd server
bun install
cp .env.example .env   # fill in JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_SECRET
bun run db:migrate
bun run db:seed
bun run dev
```

### 2. Frontend

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:3000
```

```bash
# Run in the browser
npm run dev

# Run as a desktop app
npm run tauri dev
```

### Build

```bash
# Web only
npm run build

# Desktop (produces a native installer)
npm run tauri build
```

### Other scripts

```bash
npm run format          # Prettier — formats src/**/*.{ts,vue,css}
npm run optimize-images # Compress/resize originals from server/data/originals → server/data/compressed
```

## Project Structure

```
src/
  views/          # Page-level components (Home, Catalog, PlantDetail, ...)
  components/     # Reusable UI components
  composables/    # Vue composables (useWaterOptions, useWaterWarning, ...)
  stores/         # Pinia stores (auth, plants, catalog, waterProfile)
  i18n/           # Locale files (en, it)
  router/         # Vue Router config (hash history + session-ready guard)
  types/          # Shared TypeScript types
src-tauri/        # Tauri / Rust shell
server/           # Hono + Bun backend (see server/README.md)
scripts/
  optimize-images.mjs  # sharp-based image compression tool
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with the following extensions:

- [Vue - Official (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT - see [LICENSE](LICENSE).
