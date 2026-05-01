import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { db } from './db/client'
import { refreshTokens } from './db/schema'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { catalogRoutes } from './routes/catalog'
import { plantsRoutes } from './routes/plants'
import { userRoutes } from './routes/user'
import { waterPresetsRoutes } from './routes/waterPresets'

// ── Startup: run migrations automatically ─────────────────────────────────────
const sqlite = new Database(process.env.DB_PATH ?? 'plant-care.db')
migrate(drizzle(sqlite), { migrationsFolder: './drizzle' })
sqlite.close()
console.log('✓ Migrations applied')

// ── Periodic cleanup: purge expired refresh tokens every 6 hours ──────────────
async function purgeExpiredTokens() {
  const now = new Date().toISOString()
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now))
}
void purgeExpiredTokens()
setInterval(purgeExpiredTokens, 6 * 60 * 60 * 1000)

const app = new Hono()

app.use('*', logger())
app.use('*', secureHeaders({ crossOriginResourcePolicy: false }))
app.use(
  '*',
  cors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:1420').split(','),
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
    maxAge: 600,
  }),
)

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRoutes)
app.route('/user', userRoutes)
app.route('/plants', plantsRoutes)
app.route('/catalog', catalogRoutes)
app.route('/water-presets', waterPresetsRoutes)
app.route('/admin', adminRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  fetch: app.fetch,
}
