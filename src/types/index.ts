// ─── Enums ────────────────────────────────────────────────────────────────────

export type MoistureLevel = 'dry' | 'slightly-dry' | 'moist' | 'wet' | 'waterlogged'
export type LightLevel = 'low' | 'indirect' | 'bright-indirect' | 'direct'
export type WaterHardnessTolerance = 'soft-only' | 'soft-preferred' | 'tolerant' | 'any'
export type PlantSubcategory = 'tropical' | 'succulent' | 'palm' | 'orchid' | 'herb' | 'tree'

// ─── Plant species ─────────────────────────────────────────────────────────────

export interface PlantSpecies {
  id: string
  scientificName: string
  difficulty: 'easy' | 'medium' | 'hard'

  // Moisture
  idealMoisture: MoistureLevel

  // Light
  light: LightLevel

  // Water quality
  waterHardnessTolerance: WaterHardnessTolerance
  coldWaterSensitive: boolean // true = avoid straight cold tap water (temperature shock risk)

  // Watering frequency (days between waterings)
  wateringFrequencyDays: { min: number; max: number }

  // Temperature
  temperatureRange: { min: number; max: number } // Celsius

  // Pet safety
  safeCats: boolean
  safeDogs: boolean

  // Category
  category: 'ornamental' | 'culinary'
  subcategory: PlantSubcategory
}

/** Species as returned by the catalog API — includes server-translated text fields. */
export interface CatalogSpecies extends PlantSpecies {
  name: string
  description: string
  moistureNotes: string
  lightNotes: string
  waterTips: string
  commonProblems: string[]
}

// ─── User's plant instance ────────────────────────────────────────────────────

export interface MoistureLog {
  id: string
  date: string // ISO date string
  level: MoistureLevel
  note?: string
}

export interface Plant {
  id: string
  speciesId: string
  nickname: string
  location: string
  addedDate: string // ISO date string
  moistureLogs: MoistureLog[]
  lastWateredDate?: string // ISO date string
  wateringDates?: string[] // ISO date strings of all waterings
  notes?: string
  hasPhoto?: boolean
}

// ─── Water quality ────────────────────────────────────────────────────────────

export type WaterHardnessLevel = 'very-soft' | 'soft' | 'moderately-hard' | 'hard' | 'very-hard'

export interface UserWaterProfile {
  level: WaterHardnessLevel
  hardnessMgL?: number // precise mg/L CaCO₃, optional
  ph?: number // precise pH, optional
  caMgL?: number // Ca²⁺ mg/L, optional
  mgMgL?: number // Mg²⁺ mg/L, optional
  cityName?: string // optional label
}

export interface WaterQualityInfo {
  city: string
  hardness: WaterHardnessLevel
  hardnessMgL: number // mg/L CaCO3
  ph: number
  notes: string
}
