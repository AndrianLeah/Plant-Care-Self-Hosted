import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { users } from '../db/schema'
import { requireAuth } from '../middleware/auth'

const waterProfileSchema = z
  .object({
    level: z.enum(['very-soft', 'soft', 'moderately-hard', 'hard', 'very-hard']),
    hardnessMgL: z.number().positive().optional(),
    ph: z.number().min(0).max(14).optional(),
    caMgL: z.number().positive().optional(),
    mgMgL: z.number().positive().optional(),
    cityName: z.string().optional(),
  })
  .optional()

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  lang: z.enum(['en', 'it']).optional(),
  waterProfile: waterProfileSchema,
})

export const userRoutes = new Hono()

userRoutes.use('*', requireAuth)

// GET /user/me
userRoutes.get('/me', async (c) => {
  const { sub } = c.get('jwtPayload')

  const user = await db.query.users.findFirst({ where: eq(users.id, sub) })
  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    lang: user.lang,
    waterProfile: user.waterProfile ? JSON.parse(user.waterProfile) : null,
  })
})

// PATCH /user/me
userRoutes.patch('/me', zValidator('json', updateUserSchema), async (c) => {
  const { sub } = c.get('jwtPayload')
  const body = c.req.valid('json')

  const updates: Partial<typeof users.$inferInsert> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.lang !== undefined) updates.lang = body.lang
  if (body.waterProfile !== undefined) {
    updates.waterProfile = body.waterProfile ? JSON.stringify(body.waterProfile) : null
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  const [user] = await db.update(users).set(updates).where(eq(users.id, sub)).returning()
  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    lang: user.lang,
    waterProfile: user.waterProfile ? JSON.parse(user.waterProfile) : null,
  })
})

// PATCH /user/me/credentials — change email and/or password (requires current password)
const credentialsSchema = z
  .object({
    currentPassword: z.string(),
    newEmail: z.string().email().optional(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  })
  .refine((d) => d.newEmail !== undefined || d.newPassword !== undefined, {
    message: 'Provide at least one of newEmail or newPassword',
  })

userRoutes.patch('/me/credentials', zValidator('json', credentialsSchema), async (c) => {
  const { sub } = c.get('jwtPayload')
  const { currentPassword, newEmail, newPassword } = c.req.valid('json')

  const user = await db.query.users.findFirst({ where: eq(users.id, sub) })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const valid = await Bun.password.verify(currentPassword, user.passwordHash)
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 403)

  if (newEmail && newEmail !== user.email) {
    const taken = await db.query.users.findFirst({ where: eq(users.email, newEmail) })
    if (taken) return c.json({ error: 'Email already in use' }, 409)
  }

  const updates: Partial<typeof users.$inferInsert> = {}
  if (newEmail) updates.email = newEmail
  if (newPassword) updates.passwordHash = await Bun.password.hash(newPassword)

  const [updated] = await db.update(users).set(updates).where(eq(users.id, sub)).returning()

  return c.json({ id: updated.id, email: updated.email, name: updated.name })
})
