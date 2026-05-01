import { mean, orderBy, takeRight } from 'lodash'
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { api } from '../lib/api'
import type { MoistureLevel, MoistureLog, Plant } from '../types'
import { useCatalogStore } from './catalog'

const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'

export const usePlantsStore = defineStore('plants', () => {
  const plants = ref<Plant[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const photoCache = reactive<Record<string, string>>({})

  const sortedPlants = computed(() => orderBy(plants.value, [(p) => p.nickname.toLowerCase()]))

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  async function fetchPhoto(plantId: string): Promise<void> {
    try {
      const res = await fetch(`${BASE}/plants/${plantId}/photo`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      })
      if (res.ok) {
        if (photoCache[plantId]) URL.revokeObjectURL(photoCache[plantId])
        photoCache[plantId] = URL.createObjectURL(await res.blob())
      }
    } catch {
      // silently ignore
    }
  }

  async function init(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      plants.value = await api.get<Plant[]>('/plants')
      void Promise.allSettled(plants.value.filter((p) => p.hasPhoto).map((p) => fetchPhoto(p.id)))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load plants'
    } finally {
      loading.value = false
    }
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  async function addPlant(
    data: Omit<Plant, 'id' | 'addedDate' | 'moistureLogs' | 'wateringDates'>,
  ): Promise<Plant> {
    const plant = await api.post<Plant>('/plants', data)
    plants.value.push(plant)
    return plant
  }

  async function removePlant(id: string): Promise<void> {
    await api.delete(`/plants/${id}`)
    plants.value = plants.value.filter((p) => p.id !== id)
  }

  async function updatePlant(
    id: string,
    data: Partial<Pick<Plant, 'nickname' | 'location' | 'notes'>>,
  ): Promise<void> {
    const updated = await api.patch<Plant>(`/plants/${id}`, data)
    const idx = plants.value.findIndex((p) => p.id === id)
    if (idx !== -1) plants.value[idx] = { ...plants.value[idx], ...updated }
  }

  async function logMoisture(plantId: string, level: MoistureLevel, note?: string): Promise<void> {
    const entry = await api.post<MoistureLog>(`/plants/${plantId}/moisture`, { level, note })
    const plant = plants.value.find((p) => p.id === plantId)
    if (plant) plant.moistureLogs.push(entry)
  }

  async function logWatering(plantId: string, isoDate?: string): Promise<void> {
    const date = isoDate ?? new Date().toISOString()
    await api.post(`/plants/${plantId}/watering`, { date })
    const plant = plants.value.find((p) => p.id === plantId)
    if (plant) {
      plant.lastWateredDate = date
      if (!plant.wateringDates) plant.wateringDates = []
      plant.wateringDates.push(date)
    }
  }

  async function uploadPhoto(plantId: string, file: File): Promise<void> {
    const form = new FormData()
    form.append('photo', file)
    const res = await fetch(`${BASE}/plants/${plantId}/photo`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: form,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error ?? res.statusText)
    }
    const plant = plants.value.find((p) => p.id === plantId)
    if (plant) plant.hasPhoto = true
    await fetchPhoto(plantId)
  }

  async function deletePhoto(plantId: string): Promise<void> {
    await api.delete(`/plants/${plantId}/photo`)
    const plant = plants.value.find((p) => p.id === plantId)
    if (plant) plant.hasPhoto = false
    if (photoCache[plantId]) {
      URL.revokeObjectURL(photoCache[plantId])
      delete photoCache[plantId]
    }
  }

  function getPhotoUrl(plantId: string): string | null {
    return photoCache[plantId] ?? null
  }

  // ── Read helpers ─────────────────────────────────────────────────────────────

  function getPlantById(id: string): Plant | undefined {
    return plants.value.find((p) => p.id === id)
  }

  function getLastMoisture(plantId: string): MoistureLog | undefined {
    const plant = plants.value.find((p) => p.id === plantId)
    if (!plant || plant.moistureLogs.length === 0) return undefined
    return plant.moistureLogs[plant.moistureLogs.length - 1]
  }

  /** Returns estimated next watering date as ISO string, or null if not enough data */
  function getNextWateringEstimate(plantId: string): string | null {
    const plant = plants.value.find((p) => p.id === plantId)
    if (!plant) return null

    const catalogStore = useCatalogStore()
    const species = catalogStore.getById(plant.speciesId)

    // Seasonal multiplier: shorter interval in summer, longer in winter.
    const month = new Date().getMonth() // 0=Jan … 11=Dec
    const SEASONAL: Record<number, number> = {
      0: 1.3,
      1: 1.2,
      2: 1.0,
      3: 0.9,
      4: 0.8,
      5: 0.7,
      6: 0.65,
      7: 0.7,
      8: 0.85,
      9: 1.0,
      10: 1.2,
      11: 1.3,
    }
    const seasonal = SEASONAL[month] ?? 1.0

    let avgIntervalMs: number

    const dates = plant.wateringDates
    if (dates && dates.length >= 2) {
      const sorted = [...dates].map((d) => new Date(d).getTime()).sort((a, b) => a - b)
      const recent = takeRight(sorted, 10)
      const intervals = recent.slice(1).map((t, i) => t - recent[i])
      const historicAvgMs = mean(intervals)
      const baselineMs =
        (((species?.wateringFrequencyDays.min ?? 7) + (species?.wateringFrequencyDays.max ?? 14)) /
          2) *
        86400000
      avgIntervalMs = (historicAvgMs * 0.7 + baselineMs * 0.3) * seasonal
    } else if (species) {
      const midDays = (species.wateringFrequencyDays.min + species.wateringFrequencyDays.max) / 2
      avgIntervalMs = midDays * 86400000 * seasonal
    } else {
      return null
    }

    const lastMs = plant.lastWateredDate ? new Date(plant.lastWateredDate).getTime() : Date.now()
    const baseEstimateMs = lastMs + avgIntervalMs

    const lastMoisture =
      plant.moistureLogs.length > 0 ? plant.moistureLogs[plant.moistureLogs.length - 1] : undefined

    const MOISTURE_SHIFT: Record<MoistureLevel, number> = {
      dry: -0.35,
      'slightly-dry': -0.15,
      moist: 0.1,
      wet: 0.28,
      waterlogged: 0.45,
    }

    let adjustedEstimateMs = baseEstimateMs
    if (lastMoisture) {
      const logAge = Date.now() - new Date(lastMoisture.date).getTime()
      const halfInterval = avgIntervalMs / 2
      if (logAge <= halfInterval) {
        const shift = MOISTURE_SHIFT[lastMoisture.level] ?? 0
        adjustedEstimateMs = baseEstimateMs + shift * avgIntervalMs
      }
    }

    return new Date(adjustedEstimateMs).toISOString()
  }

  // ── Export / Import (local JSON) ──────────────────────────────────────────────

  function exportPlants(): void {
    const payload = JSON.stringify({ version: 1, plants: plants.value }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plant-care-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Returns the number of plants imported, or throws on invalid payload. */
  async function importPlants(json: string): Promise<number> {
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('invalid_json')
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('plants' in parsed) ||
      !Array.isArray((parsed as { plants: unknown }).plants)
    )
      throw new Error('invalid_format')

    const incoming = (parsed as { plants: Plant[] }).plants
    // POST each plant individually so they end up server-side
    plants.value = []
    for (const p of incoming) {
      const created = await api.post<Plant>('/plants', {
        speciesId: p.speciesId,
        nickname: p.nickname,
        location: p.location,
        notes: p.notes,
      })
      // Restore logs
      for (const log of p.moistureLogs) {
        await api.post(`/plants/${created.id}/moisture`, {
          level: log.level,
          note: log.note,
          date: log.date,
        })
      }
      for (const date of p.wateringDates ?? []) {
        await api.post(`/plants/${created.id}/watering`, { date })
      }
      plants.value.push(created)
    }
    // Reload to get the full populated data
    await init()
    return incoming.length
  }

  return {
    plants,
    loading,
    error,
    sortedPlants,
    init,
    addPlant,
    removePlant,
    updatePlant,
    logMoisture,
    logWatering,
    uploadPhoto,
    deletePhoto,
    getPhotoUrl,
    getPlantById,
    getLastMoisture,
    getNextWateringEstimate,
    exportPlants,
    importPlants,
  }
})
