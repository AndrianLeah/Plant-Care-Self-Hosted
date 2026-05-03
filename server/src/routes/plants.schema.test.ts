import { describe, expect, test } from 'bun:test'
import { createPlantSchema, moistureLogSchema, wateringSchema } from './plants'

describe('plants route schemas', () => {
  test('createPlantSchema accepts optional addedDate for restore flows', () => {
    const parsed = createPlantSchema.parse({
      speciesId: 'pothos',
      nickname: 'Kitchen',
      location: 'Shelf',
      notes: 'Fast grower',
      addedDate: '2026-01-10T09:00:00.000Z',
    })
    expect(parsed.addedDate).toBe('2026-01-10T09:00:00.000Z')
  })

  test('moistureLogSchema accepts optional custom date and rejects invalid level', () => {
    const parsed = moistureLogSchema.parse({
      level: 'slightly-dry',
      note: 'before watering',
      date: '2026-04-11T14:00:00.000Z',
    })
    expect(parsed.date).toBe('2026-04-11T14:00:00.000Z')

    expect(() =>
      moistureLogSchema.parse({
        level: 'unknown-level',
      }),
    ).toThrow()
  })

  test('wateringSchema keeps optional date behavior', () => {
    expect(wateringSchema.parse({})).toEqual({})
    expect(wateringSchema.parse({ date: '2026-04-11T14:00:00.000Z' }).date).toBe(
      '2026-04-11T14:00:00.000Z',
    )
  })
})
