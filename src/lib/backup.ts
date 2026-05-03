import type { MoistureLevel, MoistureLog, Plant } from '../types'

const MOISTURE_LEVELS: MoistureLevel[] = ['dry', 'slightly-dry', 'moist', 'wet', 'waterlogged']

export interface BackupPhoto {
  mimeType: string
  base64: string
}

export interface BackupPlant {
  speciesId: string
  nickname: string
  location: string
  notes?: string
  addedDate?: string
  moistureLogs: Array<Pick<MoistureLog, 'date' | 'level' | 'note'>>
  wateringDates: string[]
  photo?: BackupPhoto
}

export interface BackupDocumentV2 {
  version: 2
  createdAt: string
  plants: BackupPlant[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isMoistureLevel(value: unknown): value is MoistureLevel {
  return typeof value === 'string' && MOISTURE_LEVELS.includes(value as MoistureLevel)
}

function normalizeMoistureLog(log: unknown): Pick<MoistureLog, 'date' | 'level' | 'note'> | null {
  if (!isRecord(log)) return null
  if (typeof log.date !== 'string' || !isMoistureLevel(log.level)) return null
  const normalized: Pick<MoistureLog, 'date' | 'level' | 'note'> = {
    date: log.date,
    level: log.level,
  }
  if (typeof log.note === 'string') normalized.note = log.note
  return normalized
}

function normalizePhoto(value: unknown): BackupPhoto | undefined {
  if (!isRecord(value)) return undefined
  if (typeof value.mimeType !== 'string' || typeof value.base64 !== 'string') return undefined
  if (!value.mimeType.startsWith('image/')) return undefined
  if (!value.base64.trim()) return undefined
  return { mimeType: value.mimeType, base64: value.base64 }
}

function normalizePlant(input: unknown): BackupPlant | null {
  if (!isRecord(input)) return null
  if (
    typeof input.speciesId !== 'string' ||
    typeof input.nickname !== 'string' ||
    typeof input.location !== 'string'
  )
    return null
  if (!Array.isArray(input.moistureLogs) || !Array.isArray(input.wateringDates)) return null

  const moistureLogs = input.moistureLogs
    .map((log) => normalizeMoistureLog(log))
    .filter((log): log is Pick<MoistureLog, 'date' | 'level' | 'note'> => log !== null)

  const wateringDates = input.wateringDates.filter((d): d is string => typeof d === 'string')

  const normalized: BackupPlant = {
    speciesId: input.speciesId,
    nickname: input.nickname,
    location: input.location,
    moistureLogs,
    wateringDates,
  }

  if (typeof input.notes === 'string') normalized.notes = input.notes
  if (typeof input.addedDate === 'string') normalized.addedDate = input.addedDate

  const photo = normalizePhoto(input.photo)
  if (photo) normalized.photo = photo

  return normalized
}

export function buildBackupDocument(
  plants: Plant[],
  photosByPlantId: Record<string, BackupPhoto | undefined>,
): BackupDocumentV2 {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    plants: plants.map((plant) => {
      const normalized: BackupPlant = {
        speciesId: plant.speciesId,
        nickname: plant.nickname,
        location: plant.location,
        moistureLogs: plant.moistureLogs.map((log) => ({
          date: log.date,
          level: log.level,
          note: log.note,
        })),
        wateringDates: [...(plant.wateringDates ?? [])],
        addedDate: plant.addedDate,
      }
      if (plant.notes) normalized.notes = plant.notes
      if (photosByPlantId[plant.id]) normalized.photo = photosByPlantId[plant.id]
      return normalized
    }),
  }
}

export function parseBackupDocument(json: string): BackupPlant[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('invalid_json')
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== 2 ||
    typeof parsed.createdAt !== 'string' ||
    !Array.isArray(parsed.plants)
  ) {
    throw new Error('invalid_format')
  }

  const normalized = parsed.plants
    .map((item) => normalizePlant(item))
    .filter((plant): plant is BackupPlant => plant !== null)

  // A valid backup must contain at least one valid plant object entry when non-empty data is supplied.
  if (parsed.plants.length > 0 && normalized.length === 0) {
    throw new Error('invalid_format')
  }

  return normalized
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = base64ToBytes(base64)
  const arrayBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(arrayBuffer).set(bytes)
  return new Blob([arrayBuffer], { type: mimeType })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof FileReader === 'undefined') {
    const buffer = await new Response(blob).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const CHUNK_SIZE = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
    }
    return btoa(binary)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image blob'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Invalid blob conversion result'))
        return
      }
      const commaIdx = result.indexOf(',')
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result)
    }
    reader.readAsDataURL(blob)
  })
}
