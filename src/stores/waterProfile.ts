import { useLocalStorage } from '@vueuse/core'
import { groupBy, map } from 'lodash'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../lib/api'
import type { UserWaterProfile, WaterHardnessLevel } from '../types'

const STORAGE_KEY = 'plant-care-water-profile'

export const HARDNESS_LEVELS: WaterHardnessLevel[] = [
  'very-soft',
  'soft',
  'moderately-hard',
  'hard',
  'very-hard',
]

export const LEVEL_DEFAULTS: Record<
  WaterHardnessLevel,
  { mgL: number; ph: number; ca: number; mg: number }
> = {
  // Representative midpoints per WHO-aligned ranges
  // WHO: soft 0–75, moderately hard 75–150, hard 150–300, very hard >300
  // "very-soft" is a subdivision of WHO "soft" (0–40 mg/L)
  // Ca:Mg ratio ≈ 3:1 by mass, typical for groundwater
  'very-soft': { mgL: 20, ph: 6.7, ca: 4, mg: 1 },
  soft: { mgL: 57, ph: 7.0, ca: 13, mg: 4 },
  'moderately-hard': { mgL: 112, ph: 7.2, ca: 27, mg: 9 },
  hard: { mgL: 210, ph: 7.5, ca: 52, mg: 17 },
  'very-hard': { mgL: 400, ph: 7.8, ca: 108, mg: 36 },
}

export const LEVEL_RANGES: Record<WaterHardnessLevel, string> = {
  'very-soft': '< 40 mg/L',
  soft: '40–75 mg/L',
  'moderately-hard': '75–150 mg/L',
  hard: '150–300 mg/L',
  'very-hard': '> 300 mg/L',
}

export interface ItalianCityPreset {
  name: string
  region: string
  level: WaterHardnessLevel
  hardnessMgL: number
  ph: number
  caMgL: number
  mgMgL: number
}

const DEFAULT_PROFILE: UserWaterProfile = {
  level: 'very-hard',
  hardnessMgL: 400,
  ph: 7.8,
  caMgL: 108,
  mgMgL: 36,
  cityName: 'Rimini',
}

function makeDefaultProfile(): UserWaterProfile {
  return { ...DEFAULT_PROFILE }
}

export const useWaterProfileStore = defineStore('waterProfile', () => {
  const profile = useLocalStorage<UserWaterProfile>(STORAGE_KEY, makeDefaultProfile())

  const cityPresets = ref<ItalianCityPreset[]>([])
  const cityPresetsByRegion = computed(() => {
    const grouped = groupBy(cityPresets.value, 'region')
    return map(grouped, (cities, region) => ({ region, cities }))
  })

  async function fetchPresets(): Promise<void> {
    cityPresets.value = await api.get<ItalianCityPreset[]>('/water-presets')
  }

  async function syncFromServer(): Promise<void> {
    const me = await api.get<{ waterProfile?: UserWaterProfile | null }>('/user/me')
    profile.value = me.waterProfile ?? makeDefaultProfile()
  }

  const displayMgL = computed(
    () => profile.value.hardnessMgL ?? LEVEL_DEFAULTS[profile.value.level].mgL,
  )

  const displayPh = computed(() => profile.value.ph ?? LEVEL_DEFAULTS[profile.value.level].ph)

  const displayCa = computed(() => profile.value.caMgL ?? LEVEL_DEFAULTS[profile.value.level].ca)

  const displayMg = computed(() => profile.value.mgMgL ?? LEVEL_DEFAULTS[profile.value.level].mg)

  async function save(p: UserWaterProfile): Promise<void> {
    await api.patch('/user/me', { waterProfile: p })
    profile.value = p
  }

  function reset(): void {
    profile.value = makeDefaultProfile()
  }

  return {
    profile,
    cityPresets,
    cityPresetsByRegion,
    fetchPresets,
    syncFromServer,
    displayMgL,
    displayPh,
    displayCa,
    displayMg,
    save,
    reset,
  }
})
