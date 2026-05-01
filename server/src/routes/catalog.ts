import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/client'
import { species, speciesImages, speciesTranslations } from '../db/schema'

const SUPPORTED_LANGS = ['en', 'it'] as const
const FALLBACK_LANG = 'en'

function resolveLang(raw: string | undefined): string {
  if (raw && (SUPPORTED_LANGS as readonly string[]).includes(raw)) return raw
  return FALLBACK_LANG
}

export const catalogRoutes = new Hono()

// GET /catalog?lang=en  — returns all species with translations (no auth required)
catalogRoutes.get('/', async (c) => {
  const lang = resolveLang(c.req.query('lang'))

  const rows = await db.select().from(species)

  if (rows.length === 0) return c.json([], 200, { 'Cache-Control': 'public, max-age=3600' })

  // Fetch translations for the requested lang; fall back to 'en' for any missing
  const [translations, fallbackTranslations] = await Promise.all([
    db
      .select()
      .from(speciesTranslations)
      .where(eq(speciesTranslations.lang, lang)),
    lang !== FALLBACK_LANG
      ? db
          .select()
          .from(speciesTranslations)
          .where(eq(speciesTranslations.lang, FALLBACK_LANG))
      : Promise.resolve([]),
  ])

  const translationMap = new Map(translations.map((t) => [t.speciesId, t]))
  const fallbackMap = new Map(fallbackTranslations.map((t) => [t.speciesId, t]))

  const result = rows.map((s) => {
    const t = translationMap.get(s.id) ?? fallbackMap.get(s.id)

    return {
      id: s.id,
      scientificName: s.scientificName,
      difficulty: s.difficulty,
      idealMoisture: s.idealMoisture,
      light: s.light,
      waterHardnessTolerance: s.waterHardnessTolerance,
      coldWaterSensitive: s.coldWaterSensitive,
      wateringFrequencyDays: { min: s.wateringFreqMin, max: s.wateringFreqMax },
      temperatureRange: { min: s.tempMin, max: s.tempMax },
      safeCats: s.safeCats,
      safeDogs: s.safeDogs,
      category: s.category,
      subcategory: s.subcategory,
      // Translated fields — null when no translation exists at all
      name: t?.name ?? null,
      description: t?.description ?? null,
      moistureNotes: t?.moistureNotes ?? null,
      lightNotes: t?.lightNotes ?? null,
      waterTips: t?.waterTips ?? null,
      commonProblems: t ? (JSON.parse(t.commonProblems) as string[]) : null,
    }
  })

  return c.json(result, 200, {
    'Cache-Control': 'public, max-age=3600',
  })
})

// GET /catalog/:id/image  — returns binary image (no auth required)
catalogRoutes.get('/:id/image', async (c) => {
  const speciesId = c.req.param('id')

  const image = await db.query.speciesImages.findFirst({
    where: eq(speciesImages.speciesId, speciesId),
  })

  if (!image) return c.json({ error: 'Image not found' }, 404)

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=604800, immutable',
      ETag: `"${speciesId}"`,
    },
  })
})
