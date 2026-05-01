/**
 * Seed script — populates the DB from self-contained JSON files in server/data/.
 *
 * Run from the server/ directory:
 *   bun run db:seed
 *
 * Requires DB_PATH env var or defaults to ./plant-care.db
 * Migrations must be applied first: bun run db:migrate
 * JSON data files must exist: bun run db:export  (one-time)
 */

import { readdir, readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { db } from '../src/db/client'
import { species, speciesImages, speciesTranslations, waterPresets } from '../src/db/schema'

const DATA_DIR = resolve(import.meta.dir, '../data')
const IMAGES_DIR = resolve(import.meta.dir, '../data/compressed')

async function seedSpecies() {
  console.log('Seeding species...')

  const raw = await readFile(join(DATA_DIR, 'species.json'), 'utf-8')
  const rows = JSON.parse(raw) as Array<{
    id: string
    scientificName: string
    difficulty: 'easy' | 'medium' | 'hard'
    idealMoisture: 'dry' | 'slightly-dry' | 'moist' | 'wet' | 'waterlogged'
    light: 'low' | 'indirect' | 'bright-indirect' | 'direct'
    waterHardnessTolerance: 'soft-only' | 'soft-preferred' | 'tolerant' | 'any'
    coldWaterSensitive: boolean
    wateringFrequencyDays: { min: number; max: number }
    temperatureRange: { min: number; max: number }
    safeCats: boolean
    safeDogs: boolean
    category: 'ornamental' | 'culinary'
    subcategory: 'tropical' | 'succulent' | 'palm' | 'orchid' | 'herb' | 'tree'
  }>

  for (const s of rows) {
    const v = {
      id: s.id,
      scientificName: s.scientificName,
      difficulty: s.difficulty,
      idealMoisture: s.idealMoisture,
      light: s.light,
      waterHardnessTolerance: s.waterHardnessTolerance,
      coldWaterSensitive: s.coldWaterSensitive,
      wateringFreqMin: s.wateringFrequencyDays.min,
      wateringFreqMax: s.wateringFrequencyDays.max,
      tempMin: s.temperatureRange.min,
      tempMax: s.temperatureRange.max,
      safeCats: s.safeCats,
      safeDogs: s.safeDogs,
      category: s.category,
      subcategory: s.subcategory,
    }
    await db
      .insert(species)
      .values(v)
      .onConflictDoUpdate({ target: species.id, set: { ...v } })
  }

  console.log(`  ✓ ${rows.length} species inserted/updated`)
}

async function seedImages() {
  console.log('Seeding species images...')

  const files = await readdir(IMAGES_DIR)
  const webpFiles = files.filter((f) => extname(f) === '.webp')

  let count = 0
  for (const file of webpFiles) {
    const speciesId = file.replace(/\.webp$/, '')
    const data = Buffer.from(await readFile(join(IMAGES_DIR, file)))
    const now = new Date().toISOString()

    await db
      .insert(speciesImages)
      .values({ speciesId, data, mimeType: 'image/webp', updatedAt: now })
      .onConflictDoUpdate({
        target: speciesImages.speciesId,
        set: { data, updatedAt: now },
      })

    count++
  }

  console.log(`  ✓ ${count} images inserted/updated`)
}

async function seedWaterPresets() {
  console.log('Seeding water presets...')

  const raw = await readFile(join(DATA_DIR, 'water-presets.json'), 'utf-8')
  const rows = JSON.parse(raw) as Array<{
    name: string
    region: string
    level: 'very-soft' | 'soft' | 'moderately-hard' | 'hard' | 'very-hard'
    hardnessMgL: number
    ph: number
    caMgL: number
    mgMgL: number
  }>

  for (const r of rows) {
    await db.insert(waterPresets).values(r).onConflictDoNothing()
  }

  console.log(`  ✓ ${rows.length} water presets inserted`)
}

async function seedTranslations() {
  console.log('Seeding species translations...')

  const raw = await readFile(join(DATA_DIR, 'translations.json'), 'utf-8')
  const rows = JSON.parse(raw) as Array<{
    speciesId: string
    lang: string
    name: string
    description: string
    moistureNotes: string
    lightNotes: string
    waterTips: string
    commonProblems: string[]
  }>

  for (const t of rows) {
    const commonProblems = JSON.stringify(t.commonProblems)
    await db
      .insert(speciesTranslations)
      .values({ ...t, commonProblems })
      .onConflictDoUpdate({
        target: [speciesTranslations.speciesId, speciesTranslations.lang],
        set: {
          name: t.name,
          description: t.description,
          moistureNotes: t.moistureNotes,
          lightNotes: t.lightNotes,
          waterTips: t.waterTips,
          commonProblems,
        },
      })
  }

  console.log(`  ✓ ${rows.length} translations inserted/updated`)
}

async function main() {
  console.log(`DB: ${process.env.DB_PATH ?? 'plant-care.db'}\n`)

  await seedSpecies()
  await seedImages()
  await seedWaterPresets()
  await seedTranslations()

  console.log('\nSeed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
