import { zValidator } from '@hono/zod-validator'
import { eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { moistureLogs, plantPhotos, plants, wateringDates } from '../db/schema'
import { requireAuth } from '../middleware/auth'

export const createPlantSchema = z.object({
  speciesId: z.string().min(1),
  nickname: z.string().min(1),
  location: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
  addedDate: z.string().datetime().optional(),
})

export const updatePlantSchema = createPlantSchema.partial()

export const moistureLogSchema = z.object({
  level: z.enum(['dry', 'slightly-dry', 'moist', 'wet', 'waterlogged']),
  note: z.string().optional(),
  date: z.string().datetime().optional(),
})

export const wateringSchema = z.object({
  date: z.string().datetime().optional(),
})

// Assembles a full Plant response object (matching the frontend Plant type)
function assemblePlant(
  plant: typeof plants.$inferSelect,
  moistureRows: (typeof moistureLogs.$inferSelect)[],
  wateringRows: (typeof wateringDates.$inferSelect)[],
  photoPlantIds?: Set<string>,
) {
  return {
    id: plant.id,
    speciesId: plant.speciesId,
    nickname: plant.nickname,
    location: plant.location,
    addedDate: plant.addedDate,
    notes: plant.notes ?? undefined,
    hasPhoto: photoPlantIds ? photoPlantIds.has(plant.id) : false,
    lastWateredDate: plant.lastWateredDate ?? undefined,
    moistureLogs: moistureRows
      .filter((m) => m.plantId === plant.id)
      .map((m) => ({ id: m.id, date: m.date, level: m.level, note: m.note ?? undefined })),
    wateringDates: wateringRows.filter((w) => w.plantId === plant.id).map((w) => w.date),
  }
}

export const plantsRoutes = new Hono()

plantsRoutes.use('*', requireAuth)

// GET /plants
plantsRoutes.get('/', async (c) => {
  const { sub } = c.get('jwtPayload')

  const plantRows = await db.select().from(plants).where(eq(plants.userId, sub))

  if (plantRows.length === 0) return c.json([])

  const ids = plantRows.map((p) => p.id)
  const [moistureRows, wateringRows, photoRows] = await Promise.all([
    db.select().from(moistureLogs).where(inArray(moistureLogs.plantId, ids)),
    db.select().from(wateringDates).where(inArray(wateringDates.plantId, ids)),
    db.select({ plantId: plantPhotos.plantId }).from(plantPhotos).where(inArray(plantPhotos.plantId, ids)),
  ])
  const photoIds = new Set(photoRows.map((r) => r.plantId))

  return c.json(plantRows.map((p) => assemblePlant(p, moistureRows, wateringRows, photoIds)))
})

// DELETE /plants  — remove all plants for current user
plantsRoutes.delete('/', async (c) => {
  const { sub } = c.get('jwtPayload')
  await db.delete(plants).where(eq(plants.userId, sub))
  return c.json({ ok: true })
})

// POST /plants
plantsRoutes.post('/', zValidator('json', createPlantSchema), async (c) => {
  const { sub } = c.get('jwtPayload')
  const body = c.req.valid('json')

  const [plant] = await db
    .insert(plants)
    .values({
      id: crypto.randomUUID(),
      userId: sub,
      speciesId: body.speciesId,
      nickname: body.nickname,
      location: body.location ?? '',
      addedDate: body.addedDate ?? new Date().toISOString(),
      notes: body.notes ?? null,
      photoUrl: body.photoUrl ?? null,
    })
    .returning()

  return c.json(assemblePlant(plant, [], [], new Set()), 201)
})

// PATCH /plants/:id
plantsRoutes.patch('/:id', zValidator('json', updatePlantSchema), async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')
  const body = c.req.valid('json')

  const existing = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!existing) return c.json({ error: 'Plant not found' }, 404)
  if (existing.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  const updates: Partial<typeof plants.$inferInsert> = {}
  if (body.speciesId !== undefined) updates.speciesId = body.speciesId
  if (body.nickname !== undefined) updates.nickname = body.nickname
  if (body.location !== undefined) updates.location = body.location
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.photoUrl !== undefined) updates.photoUrl = body.photoUrl

  const [updated] = await db.update(plants).set(updates).where(eq(plants.id, plantId)).returning()

  const [moistureRows, wateringRows, photoRows] = await Promise.all([
    db.select().from(moistureLogs).where(eq(moistureLogs.plantId, plantId)),
    db.select().from(wateringDates).where(eq(wateringDates.plantId, plantId)),
    db.select({ plantId: plantPhotos.plantId }).from(plantPhotos).where(eq(plantPhotos.plantId, plantId)),
  ])
  const photoIds = new Set(photoRows.map((r) => r.plantId))

  return c.json(assemblePlant(updated, moistureRows, wateringRows, photoIds))
})

// DELETE /plants/:id
plantsRoutes.delete('/:id', async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')

  const existing = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!existing) return c.json({ error: 'Plant not found' }, 404)
  if (existing.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  await db.delete(plants).where(eq(plants.id, plantId))

  return c.json({ ok: true })
})

// POST /plants/:id/moisture
plantsRoutes.post('/:id/moisture', zValidator('json', moistureLogSchema), async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')
  const body = c.req.valid('json')

  const plant = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!plant) return c.json({ error: 'Plant not found' }, 404)
  if (plant.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  const [log] = await db
    .insert(moistureLogs)
    .values({
      id: crypto.randomUUID(),
      plantId,
      date: body.date ?? new Date().toISOString(),
      level: body.level,
      note: body.note ?? null,
    })
    .returning()

  return c.json({ id: log.id, date: log.date, level: log.level, note: log.note ?? undefined }, 201)
})

// POST /plants/:id/watering
plantsRoutes.post('/:id/watering', zValidator('json', wateringSchema), async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')
  const body = c.req.valid('json')

  const plant = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!plant) return c.json({ error: 'Plant not found' }, 404)
  if (plant.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  const date = body.date ?? new Date().toISOString()

  await Promise.all([
    db.insert(wateringDates).values({ id: crypto.randomUUID(), plantId, date }),
    db.update(plants).set({ lastWateredDate: date }).where(eq(plants.id, plantId)),
  ])

  return c.json({ date }, 201)
})

// GET /plants/:id/photo  — serve plant photo
plantsRoutes.get('/:id/photo', async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')

  const plant = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!plant) return c.json({ error: 'Plant not found' }, 404)
  if (plant.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  const photo = await db.query.plantPhotos.findFirst({ where: eq(plantPhotos.plantId, plantId) })
  if (!photo) return c.json({ error: 'No photo' }, 404)

  return new Response(new Uint8Array(photo.data), {
    headers: { 'Content-Type': photo.mimeType, 'Cache-Control': 'private, max-age=31536000' },
  })
})

// PUT /plants/:id/photo  — upload or replace plant photo (multipart, field: "photo")
plantsRoutes.put('/:id/photo', async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')

  const plant = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!plant) return c.json({ error: 'Plant not found' }, 404)
  if (plant.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.parseBody()
  const file = body['photo']
  if (!(file instanceof File)) return c.json({ error: 'Field "photo" must be a file' }, 400)

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) return c.json({ error: 'Only jpeg, png, webp allowed' }, 415)

  const MAX_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_BYTES) return c.json({ error: 'Image must be ≤ 5 MB' }, 413)

  const buffer = Buffer.from(await file.arrayBuffer())

  await db
    .insert(plantPhotos)
    .values({ plantId, data: buffer, mimeType: file.type, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: plantPhotos.plantId,
      set: { data: buffer, mimeType: file.type, updatedAt: new Date().toISOString() },
    })

  return c.json({ ok: true })
})

// DELETE /plants/:id/photo
plantsRoutes.delete('/:id/photo', async (c) => {
  const { sub } = c.get('jwtPayload')
  const plantId = c.req.param('id')

  const plant = await db.query.plants.findFirst({ where: eq(plants.id, plantId) })
  if (!plant) return c.json({ error: 'Plant not found' }, 404)
  if (plant.userId !== sub) return c.json({ error: 'Forbidden' }, 403)

  await db.delete(plantPhotos).where(eq(plantPhotos.plantId, plantId))

  return c.json({ ok: true })
})
