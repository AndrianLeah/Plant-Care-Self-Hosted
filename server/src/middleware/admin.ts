import { createMiddleware } from 'hono/factory'

export const requireAdmin = createMiddleware(async (c, next) => {
  const secret = c.req.header('X-Admin-Secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
})
