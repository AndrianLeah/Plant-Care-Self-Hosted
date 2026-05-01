import { Hono } from 'hono'
import { db } from '../db/client'
import { waterPresets } from '../db/schema'

export const waterPresetsRoutes = new Hono()

// GET /water-presets  — returns all city presets (no auth required)
waterPresetsRoutes.get('/', async (c) => {
  const rows = await db.select().from(waterPresets)

  const result = rows.map((r) => ({
    name: r.name,
    region: r.region,
    level: r.level,
    hardnessMgL: r.hardnessMgL,
    ph: r.ph,
    caMgL: r.caMgL,
    mgMgL: r.mgMgL,
  }))

  return c.json(result, 200, {
    'Cache-Control': 'public, max-age=86400',
  })
})
