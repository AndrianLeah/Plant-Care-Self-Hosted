import { zValidator } from '@hono/zod-validator'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { eq, and } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { species, speciesImages, speciesTranslations, waterPresets } from '../db/schema'
import { SQLITE_GUI_PORT } from '../lib/sqliteGui'
import { requireAdmin } from '../middleware/admin'

const speciesSchema = z.object({
  id: z.string().min(1),
  scientificName: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  idealMoisture: z.enum(['dry', 'slightly-dry', 'moist', 'wet', 'waterlogged']),
  light: z.enum(['low', 'indirect', 'bright-indirect', 'direct']),
  waterHardnessTolerance: z.enum(['soft-only', 'soft-preferred', 'tolerant', 'any']),
  coldWaterSensitive: z.boolean(),
  wateringFrequencyDays: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
  temperatureRange: z.object({ min: z.number().int(), max: z.number().int() }),
  safeCats: z.boolean(),
  safeDogs: z.boolean(),
  category: z.enum(['ornamental', 'culinary']),
  subcategory: z.enum(['tropical', 'succulent', 'palm', 'orchid', 'herb', 'tree']),
})

const updateSpeciesSchema = speciesSchema.omit({ id: true }).partial()

const waterPresetSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  level: z.enum(['very-soft', 'soft', 'moderately-hard', 'hard', 'very-hard']),
  hardnessMgL: z.number().positive(),
  ph: z.number().min(0).max(14),
  caMgL: z.number().positive(),
  mgMgL: z.number().positive(),
})

const translationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  moistureNotes: z.string().min(1),
  lightNotes: z.string().min(1),
  waterTips: z.string().min(1),
  commonProblems: z.array(z.string()).min(1),
})

const DB_GUI_SESSION_COOKIE = 'admin_db_session'
const DB_GUI_SESSION_VALUE = 'ok'
const DB_GUI_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

function getPublicPrefix(c: Context): string {
  const raw = c.req.header('X-Forwarded-Prefix')
  if (!raw) return ''
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

function getPublicDbBase(c: Context): string {
  return `${getPublicPrefix(c)}/admin/db`
}

function stripPrefix(pathname: string, prefix: string): string | null {
  if (pathname === prefix) return '/'
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length)
  return null
}

function getGuiPathFromAdminPath(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`

  // Hono/Nginx can expose different path shapes depending on mount/proxy setup.
  // Normalize all expected variants to the sqlite-gui root path.
  for (const prefix of ['/api/admin/db', '/admin/db', '/db']) {
    const stripped = stripPrefix(normalized, prefix)
    if (stripped !== null) {
      return stripped === '/' ? '/home' : stripped
    }
  }

  return normalized === '/' ? '/home' : normalized
}

function rewritePathLiterals(content: string, from: string, to: string): string {
  return content
    .replaceAll(`"${from}`, `"${to}`)
    .replaceAll(`'${from}`, `'${to}`)
    .replaceAll(`\`${from}`, `\`${to}`)
}

function rewriteGuiContent(content: string, publicBase: string): string {
  const replacements: Array<[string, string]> = [
    ['/api/tables', `${publicBase}/api/tables`],
    ['/home', `${publicBase}/home`],
    ['/query', `${publicBase}/query`],
    ['/createtable', `${publicBase}/createtable`],
    ['/insert/', `${publicBase}/insert/`],
    ['/edit/', `${publicBase}/edit/`],
    ['/output.sql', `${publicBase}/output.sql`],
    ['/stylesheets/', `${publicBase}/stylesheets/`],
    ['/javascripts/', `${publicBase}/javascripts/`],
    ['/icons/', `${publicBase}/icons/`],
    ['/img/', `${publicBase}/img/`],
    ['/import', `${publicBase}/import`],
  ]

  let rewritten = content
  for (const [from, to] of replacements) {
    rewritten = rewritePathLiterals(rewritten, from, to)
  }

  // sqlite-gui-node includes a source map as a stylesheet link; remove it to avoid MIME errors.
  rewritten = rewritten.replace(
    /<link[^>]+href=["'`][^"'`]*\/stylesheets\/main\.css\.map["'`][^>]*>\s*/gi,
    '',
  )

  // sqlite-gui-node scripts assume routes live at '/...'; strip '/admin/db' prefix before splitting.
  rewritten = rewritten.replaceAll(
    'window.location.pathname.split("/")',
    'window.location.pathname.replace(/^(\\/api)?\\/admin\\/db/, "").split("/")',
  )

  return rewritten
}

const requireDbGuiSession = createMiddleware(async (c, next) => {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return c.json({ error: 'Admin secret not configured' }, 500)
  }

  const session = await getSignedCookie(c, adminSecret, DB_GUI_SESSION_COOKIE)
  if (session !== DB_GUI_SESSION_VALUE) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await next()
})

export const adminRoutes = new Hono()

// ─── SQLite GUI session bootstrap (requires admin header once) ───────────────

adminRoutes.post('/db/session', requireAdmin, async (c) => {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return c.json({ error: 'Admin secret not configured' }, 500)
  }

  const cookiePath = getPublicDbBase(c)
  await setSignedCookie(c, DB_GUI_SESSION_COOKIE, DB_GUI_SESSION_VALUE, adminSecret, {
    path: cookiePath,
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.req.url.startsWith('https://'),
    maxAge: DB_GUI_SESSION_MAX_AGE_SECONDS,
  })

  const guiUrl = new URL(`${cookiePath}/home`, c.req.url).toString()
  return c.json({ ok: true, url: guiUrl })
})

adminRoutes.delete('/db/session', requireAdmin, (c) => {
  deleteCookie(c, DB_GUI_SESSION_COOKIE, { path: getPublicDbBase(c) })
  return c.json({ ok: true })
})

// ─── SQLite GUI proxy (cookie-authenticated) ─────────────────────────────────

adminRoutes.get('/db', requireDbGuiSession, (c) => {
  return c.redirect(`${getPublicDbBase(c)}/home`)
})

adminRoutes.use('/db/*', requireDbGuiSession)

adminRoutes.all('/db/*', async (c) => {
  const publicBase = getPublicDbBase(c)
  const url = new URL(c.req.url)
  const guiPath = getGuiPathFromAdminPath(c.req.path)
  const target = `http://127.0.0.1:${SQLITE_GUI_PORT}${guiPath}${url.search}`

  const requestHeaders = new Headers(c.req.raw.headers)
  requestHeaders.delete('host')
  requestHeaders.delete('content-length')

  const method = c.req.method
  const body = method === 'GET' || method === 'HEAD' ? undefined : c.req.raw.body

  const upstream = await fetch(target, {
    method,
    headers: requestHeaders,
    body,
    redirect: 'manual',
  })

  const responseHeaders = new Headers(upstream.headers)
  const location = responseHeaders.get('location')
  if (location?.startsWith('/')) {
    responseHeaders.set('location', `${publicBase}${location}`)
  }

  const contentType = responseHeaders.get('content-type') ?? ''
  const isRewritable =
    contentType.includes('text/html') ||
    contentType.includes('application/javascript') ||
    contentType.includes('text/javascript')

  if (isRewritable) {
    const rewritten = rewriteGuiContent(await upstream.text(), publicBase)
    responseHeaders.delete('content-length')
    return new Response(rewritten, {
      status: upstream.status,
      headers: responseHeaders,
    })
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
})

// ─── Species ──────────────────────────────────────────────────────────────────

// POST /admin/catalog
adminRoutes.post('/catalog', requireAdmin, zValidator('json', speciesSchema), async (c) => {
  const body = c.req.valid('json')

  const existing = await db.query.species.findFirst({ where: eq(species.id, body.id) })
  if (existing) return c.json({ error: 'Species ID already exists' }, 409)

  await db.insert(species).values({
    id: body.id,
    scientificName: body.scientificName,
    difficulty: body.difficulty,
    idealMoisture: body.idealMoisture,
    light: body.light,
    waterHardnessTolerance: body.waterHardnessTolerance,
    coldWaterSensitive: body.coldWaterSensitive,
    wateringFreqMin: body.wateringFrequencyDays.min,
    wateringFreqMax: body.wateringFrequencyDays.max,
    tempMin: body.temperatureRange.min,
    tempMax: body.temperatureRange.max,
    safeCats: body.safeCats,
    safeDogs: body.safeDogs,
    category: body.category,
    subcategory: body.subcategory,
  })

  return c.json({ id: body.id }, 201)
})

// PATCH /admin/catalog/:id
adminRoutes.patch('/catalog/:id', requireAdmin, zValidator('json', updateSpeciesSchema), async (c) => {
  const speciesId = c.req.param('id')
  const body = c.req.valid('json')

  const existing = await db.query.species.findFirst({ where: eq(species.id, speciesId) })
  if (!existing) return c.json({ error: 'Species not found' }, 404)

  const updates: Partial<typeof species.$inferInsert> = {}
  if (body.scientificName !== undefined) updates.scientificName = body.scientificName
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty
  if (body.idealMoisture !== undefined) updates.idealMoisture = body.idealMoisture
  if (body.light !== undefined) updates.light = body.light
  if (body.waterHardnessTolerance !== undefined) updates.waterHardnessTolerance = body.waterHardnessTolerance
  if (body.coldWaterSensitive !== undefined) updates.coldWaterSensitive = body.coldWaterSensitive
  if (body.wateringFrequencyDays !== undefined) {
    updates.wateringFreqMin = body.wateringFrequencyDays.min
    updates.wateringFreqMax = body.wateringFrequencyDays.max
  }
  if (body.temperatureRange !== undefined) {
    updates.tempMin = body.temperatureRange.min
    updates.tempMax = body.temperatureRange.max
  }
  if (body.safeCats !== undefined) updates.safeCats = body.safeCats
  if (body.safeDogs !== undefined) updates.safeDogs = body.safeDogs
  if (body.category !== undefined) updates.category = body.category
  if (body.subcategory !== undefined) updates.subcategory = body.subcategory

  await db.update(species).set(updates).where(eq(species.id, speciesId))

  return c.json({ ok: true })
})

// DELETE /admin/catalog/:id
adminRoutes.delete('/catalog/:id', requireAdmin, async (c) => {
  const speciesId = c.req.param('id')

  const existing = await db.query.species.findFirst({ where: eq(species.id, speciesId) })
  if (!existing) return c.json({ error: 'Species not found' }, 404)

  await db.delete(species).where(eq(species.id, speciesId))

  return c.json({ ok: true })
})

// PUT /admin/catalog/:id/image  (multipart/form-data, field: "image")
adminRoutes.put('/catalog/:id/image', requireAdmin, async (c) => {
  const speciesId = c.req.param('id')

  const existing = await db.query.species.findFirst({ where: eq(species.id, speciesId) })
  if (!existing) return c.json({ error: 'Species not found' }, 404)

  const body = await c.req.parseBody()
  const file = body['image']

  if (!(file instanceof File)) {
    return c.json({ error: 'Field "image" is required and must be a file' }, 400)
  }

  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Only webp, png, and jpeg images are allowed' }, 415)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const now = new Date().toISOString()

  await db
    .insert(speciesImages)
    .values({ speciesId, data: buffer, mimeType: file.type, updatedAt: now })
    .onConflictDoUpdate({
      target: speciesImages.speciesId,
      set: { data: buffer, mimeType: file.type, updatedAt: now },
    })

  return c.json({ ok: true })
})

// ─── Water presets ────────────────────────────────────────────────────────────

// POST /admin/water-presets
adminRoutes.post('/water-presets', requireAdmin, zValidator('json', waterPresetSchema), async (c) => {
  const body = c.req.valid('json')

  const [row] = await db
    .insert(waterPresets)
    .values({
      name: body.name,
      region: body.region,
      level: body.level,
      hardnessMgL: body.hardnessMgL,
      ph: body.ph,
      caMgL: body.caMgL,
      mgMgL: body.mgMgL,
    })
    .returning()

  return c.json({ id: row.id }, 201)
})

// PATCH /admin/water-presets/:id
adminRoutes.patch(
  '/water-presets/:id',
  requireAdmin,
  zValidator('json', waterPresetSchema.partial()),
  async (c) => {
    const presetId = parseInt(c.req.param('id'), 10)
    if (isNaN(presetId)) return c.json({ error: 'Invalid id' }, 400)

    const body = c.req.valid('json')

    const existing = await db.query.waterPresets.findFirst({
      where: eq(waterPresets.id, presetId),
    })
    if (!existing) return c.json({ error: 'Preset not found' }, 404)

    await db.update(waterPresets).set(body).where(eq(waterPresets.id, presetId))

    return c.json({ ok: true })
  },
)

// DELETE /admin/water-presets/:id
adminRoutes.delete('/water-presets/:id', requireAdmin, async (c) => {
  const presetId = parseInt(c.req.param('id'), 10)
  if (isNaN(presetId)) return c.json({ error: 'Invalid id' }, 400)

  const existing = await db.query.waterPresets.findFirst({
    where: eq(waterPresets.id, presetId),
  })
  if (!existing) return c.json({ error: 'Preset not found' }, 404)

  await db.delete(waterPresets).where(eq(waterPresets.id, presetId))

  return c.json({ ok: true })
})

// ─── Species translations ─────────────────────────────────────────────────────

// PUT /admin/catalog/:id/translations/:lang  (upsert)
adminRoutes.put(
  '/catalog/:id/translations/:lang',
  requireAdmin,
  zValidator('json', translationSchema),
  async (c) => {
    const speciesId = c.req.param('id')
    const lang = c.req.param('lang')
    const body = c.req.valid('json')

    const existing = await db.query.species.findFirst({ where: eq(species.id, speciesId) })
    if (!existing) return c.json({ error: 'Species not found' }, 404)

    await db
      .insert(speciesTranslations)
      .values({
        speciesId,
        lang,
        name: body.name,
        description: body.description,
        moistureNotes: body.moistureNotes,
        lightNotes: body.lightNotes,
        waterTips: body.waterTips,
        commonProblems: JSON.stringify(body.commonProblems),
      })
      .onConflictDoUpdate({
        target: [speciesTranslations.speciesId, speciesTranslations.lang],
        set: {
          name: body.name,
          description: body.description,
          moistureNotes: body.moistureNotes,
          lightNotes: body.lightNotes,
          waterTips: body.waterTips,
          commonProblems: JSON.stringify(body.commonProblems),
        },
      })

    return c.json({ ok: true })
  },
)

// DELETE /admin/catalog/:id/translations/:lang
adminRoutes.delete('/catalog/:id/translations/:lang', requireAdmin, async (c) => {
  const speciesId = c.req.param('id')
  const lang = c.req.param('lang')

  await db
    .delete(speciesTranslations)
    .where(
      and(eq(speciesTranslations.speciesId, speciesId), eq(speciesTranslations.lang, lang)),
    )

  return c.json({ ok: true })
})
