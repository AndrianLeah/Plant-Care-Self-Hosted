import { createMiddleware } from 'hono/factory'

interface Window {
  count: number
  resetAt: number
}

/**
 * Simple in-memory sliding-window rate limiter keyed by IP address.
 * Good enough for a single-process Bun server.
 *
 * @param max      Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(max: number, windowMs: number) {
  const store = new Map<string, Window>()

  // Sweep expired entries every window to avoid unbounded memory growth
  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store) {
      if (win.resetAt <= now) store.delete(key)
    }
  }, windowMs)

  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const now = Date.now()
    let win = store.get(ip)

    if (!win || win.resetAt <= now) {
      win = { count: 1, resetAt: now + windowMs }
      store.set(ip, win)
    } else {
      win.count++
    }

    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(Math.max(0, max - win.count)))
    c.header('X-RateLimit-Reset', String(Math.ceil(win.resetAt / 1000)))

    if (win.count > max) {
      return c.json({ error: 'Too many requests, please try again later.' }, 429)
    }

    await next()
  })
}
