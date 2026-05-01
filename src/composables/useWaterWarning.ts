import type { Ref } from 'vue'
import { computed } from 'vue'
import { HARDNESS_LEVELS, useWaterProfileStore } from '../stores/waterProfile'
import type { PlantSpecies } from '../types'

export function useWaterWarning(species: Ref<PlantSpecies | undefined>) {
  const waterProfileStore = useWaterProfileStore()

  return computed(() => {
    if (!species.value) return false
    const userIdx = HARDNESS_LEVELS.indexOf(waterProfileStore.profile.level)
    const tolerance = species.value.waterHardnessTolerance
    if (tolerance === 'soft-only') return userIdx >= 2
    if (tolerance === 'soft-preferred') return userIdx >= 3
    if (tolerance === 'tolerant') return userIdx >= 4
    return false
  })
}
