import { createMiddleware } from 'hono/factory'
import { verifyAccessToken, type AccessTokenPayload } from '../lib/jwt'

declare module 'hono' {
  interface ContextVariableMap {
    jwtPayload: AccessTokenPayload
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const payload = await verifyAccessToken(header.slice(7))
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
