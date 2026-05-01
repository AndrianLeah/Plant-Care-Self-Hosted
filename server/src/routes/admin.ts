import { zValidator } from '@hono/zod-validator'
import { eq, and } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { species, speciesImages, speciesTranslations, waterPresets } from '../db/schema'
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

export const adminRoutes = new Hono()

adminRoutes.use('*', requireAdmin)

// ─── Species ──────────────────────────────────────────────────────────────────

// POST /admin/catalog
adminRoutes.post('/catalog', zValidator('json', speciesSchema), async (c) => {
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
adminRoutes.patch('/catalog/:id', zValidator('json', updateSpeciesSchema), async (c) => {
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
adminRoutes.delete('/catalog/:id', async (c) => {
  const speciesId = c.req.param('id')

  const existing = await db.query.species.findFirst({ where: eq(species.id, speciesId) })
  if (!existing) return c.json({ error: 'Species not found' }, 404)

  await db.delete(species).where(eq(species.id, speciesId))

  return c.json({ ok: true })
})

// PUT /admin/catalog/:id/image  (multipart/form-data, field: "image")
adminRoutes.put('/catalog/:id/image', async (c) => {
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
adminRoutes.post('/water-presets', zValidator('json', waterPresetSchema), async (c) => {
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
adminRoutes.delete('/water-presets/:id', async (c) => {
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

const translationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  moistureNotes: z.string().min(1),
  lightNotes: z.string().min(1),
  waterTips: z.string().min(1),
  commonProblems: z.array(z.string()).min(1),
})

// PUT /admin/catalog/:id/translations/:lang  (upsert)
adminRoutes.put(
  '/catalog/:id/translations/:lang',
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
adminRoutes.delete('/catalog/:id/translations/:lang', async (c) => {
  const speciesId = c.req.param('id')
  const lang = c.req.param('lang')

  await db
    .delete(speciesTranslations)
    .where(
      and(eq(speciesTranslations.speciesId, speciesId), eq(speciesTranslations.lang, lang)),
    )

  return c.json({ ok: true })
})
