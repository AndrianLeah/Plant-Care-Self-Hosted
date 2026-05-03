import { describe, expect, it } from 'vitest'
import type { Plant } from '../types'
import {
  blobToBase64,
  buildBackupDocument,
  decodeBase64ToBlob,
  parseBackupDocument,
} from './backup'

describe('backup utilities', () => {
  it('builds and parses a v2 backup with photo payloads', async () => {
    const plants: Plant[] = [
      {
        id: 'p1',
        speciesId: 'monstera-deliciosa',
        nickname: 'Living room',
        location: 'Window',
        addedDate: '2026-01-01T12:00:00.000Z',
        notes: 'Needs support',
        moistureLogs: [
          {
            id: 'm1',
            date: '2026-02-01T12:00:00.000Z',
            level: 'moist',
            note: 'Looks healthy',
          },
        ],
        wateringDates: ['2026-02-01T12:00:00.000Z'],
        hasPhoto: true,
      },
    ]

    const photoBlob = new Blob(['fake-image'], { type: 'image/webp' })
    const backup = buildBackupDocument(plants, {
      p1: {
        mimeType: 'image/webp',
        base64: await blobToBase64(photoBlob),
      },
    })

    const parsed = parseBackupDocument(JSON.stringify(backup))
    expect(parsed).toHaveLength(1)
    expect(parsed[0].addedDate).toBe('2026-01-01T12:00:00.000Z')
    expect(parsed[0].moistureLogs[0].date).toBe('2026-02-01T12:00:00.000Z')
    expect(parsed[0].photo?.mimeType).toBe('image/webp')
  })

  it('round-trips base64 photo decoding', async () => {
    const blob = new Blob(['abc123'], { type: 'image/jpeg' })
    const base64 = await blobToBase64(blob)
    expect(base64.length).toBeGreaterThan(0)

    const decoded = decodeBase64ToBlob('YWJjMTIz', 'image/jpeg')
    expect(decoded.type).toBe('image/jpeg')
    expect(decoded.size).toBeGreaterThan(0)
  })

  it('rejects invalid backup payloads', () => {
    expect(() => parseBackupDocument('{bad json')).toThrowError('invalid_json')
    expect(() => parseBackupDocument(JSON.stringify({ nope: [] }))).toThrowError('invalid_format')
    expect(() =>
      parseBackupDocument(
        JSON.stringify({
          version: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          plants: [],
        }),
      ),
    ).toThrowError('invalid_format')
    expect(() => parseBackupDocument(JSON.stringify({ plants: [123] }))).toThrowError(
      'invalid_format',
    )
  })
})
