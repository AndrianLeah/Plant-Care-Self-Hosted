import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { refreshTokens, users } from '../db/schema'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { rateLimit } from '../lib/rateLimit'
import { requireAuth } from '../middleware/auth'

// 10 attempts per 15 minutes per IP
const authRateLimit = rateLimit(10, 15 * 60 * 1000)

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

async function issueTokenPair(userId: string, email: string) {
  const jti = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: userId, email }),
    signRefreshToken({ sub: userId, jti }),
  ])

  await db.insert(refreshTokens).values({
    jti,
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  })

  return { accessToken, refreshToken }
}

export const authRoutes = new Hono()

// POST /auth/register
authRoutes.post('/register', authRateLimit, zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await Bun.password.hash(password)
  const userId = crypto.randomUUID()

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      passwordHash,
      name: name ?? null,
      createdAt: new Date().toISOString(),
    })
    .returning()

  const { accessToken, refreshToken } = await issueTokenPair(userId, email)

  return c.json(
    {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, lang: user.lang },
    },
    201,
  )
})

// POST /auth/login
authRoutes.post('/login', authRateLimit, zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await Bun.password.verify(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.email)

  return c.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, lang: user.lang },
  })
})

// POST /auth/refresh
authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')

  let payload
  try {
    payload = await verifyRefreshToken(refreshToken)
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401)
  }

  // Check jti exists in DB (not yet revoked)
  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.jti, payload.jti),
  })
  if (!stored) {
    return c.json({ error: 'Refresh token revoked' }, 401)
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, payload.sub) })
  if (!user) {
    return c.json({ error: 'User not found' }, 401)
  }

  // Rotate: delete old jti, issue new pair
  await db.delete(refreshTokens).where(eq(refreshTokens.jti, payload.jti))
  const tokens = await issueTokenPair(user.id, user.email)

  return c.json(tokens)
})

// POST /auth/logout  (requires auth)
authRoutes.post('/logout', requireAuth, zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')

  try {
    const payload = await verifyRefreshToken(refreshToken)
    await db.delete(refreshTokens).where(eq(refreshTokens.jti, payload.jti))
  } catch {
    // Token already invalid — still return 200
  }

  return c.json({ ok: true })
})
