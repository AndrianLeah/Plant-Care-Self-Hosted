<template>
  <div
    class="card-glass rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform flex flex-col"
    @click="$router.push(`/plant/${plant.id}`)"
  >
    <!-- Image -->
    <div
      class="aspect-[4/3] bg-leaf-50 flex items-center justify-center overflow-hidden flex-shrink-0 max-h-48 relative"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="species ? t(`species.${species.id}.name`) : ''"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <i v-else class="mdi mdi-leaf text-leaf-300" style="font-size: 3rem" />
      <!-- Urgency dot -->
      <span
        v-if="isDue"
        class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-orange-400 shadow ring-2 ring-white"
        title="Needs watering"
      />
    </div>

    <!-- Content -->
    <div class="flex flex-col p-3 gap-2 flex-1">
      <div>
        <div class="text-base font-extrabold text-slate-900 leading-tight truncate">
          {{ plant.nickname }}
        </div>
        <div
          v-if="plant.location"
          class="text-xs text-slate-500 truncate flex items-center gap-0.5 mt-1"
        >
          <i class="mdi mdi-map-marker-outline" />
          {{ plant.location }}
        </div>
      </div>

      <!-- Stats row -->
      <div class="flex items-center justify-between mt-auto pt-2">
        <MoistureBadge v-if="lastMoisture" :level="lastMoisture.level" />
        <span v-else class="text-xs text-slate-500">—</span>
        <span
          v-if="nextWatering"
          :class="[
            'text-xs font-medium flex items-center gap-1',
            isDue ? 'text-orange-500' : 'text-slate-500',
          ]"
        >
          <i
            :class="[
              'mdi',
              isDue
                ? 'mdi-calendar-alert text-orange-400'
                : 'mdi-calendar-clock-outline text-violet-400',
            ]"
          />
          {{
            isDue
              ? t('plant_card.water_due')
              : t('plant_card.water_in', { days: daysUntilWatering })
          }}
        </span>
        <span
          v-else-if="plant.lastWateredDate"
          :class="[
            'text-xs font-medium flex items-center gap-1',
            isOverdue ? 'text-orange-500' : 'text-slate-500',
          ]"
        >
          <i
            :class="[
              'mdi',
              isOverdue
                ? 'mdi-water-alert-outline text-orange-400'
                : 'mdi-water-outline text-sky-400',
            ]"
          />
          {{ t('detail.days_ago', { days: daysSinceWatered }) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSpeciesById } from '../data/plants'
import { useCatalogStore } from '../stores/catalog'
import { usePlantsStore } from '../stores/plants'
import type { Plant } from '../types'
import MoistureBadge from './MoistureBadge.vue'

const props = defineProps<{ plant: Plant }>()
const store = usePlantsStore()
const catalogStore = useCatalogStore()
const { t } = useI18n()

const species = computed(() => getSpeciesById(props.plant.speciesId))
const imageUrl = computed(() =>
  props.plant.hasPhoto
    ? store.getPhotoUrl(props.plant.id)
    : catalogStore.getImageUrl(props.plant.speciesId),
)
const lastMoisture = computed(() => store.getLastMoisture(props.plant.id))
const daysSinceWatered = computed(() => {
  if (!props.plant.lastWateredDate) return null
  return dayjs().diff(dayjs(props.plant.lastWateredDate), 'day')
})

const isOverdue = computed(() => {
  if (!daysSinceWatered.value || !species.value) return false
  return daysSinceWatered.value > species.value.wateringFrequencyDays.max
})

const nextWatering = computed(() => store.getNextWateringEstimate(props.plant.id))

const daysUntilWatering = computed(() => {
  if (!nextWatering.value) return null
  return Math.ceil(dayjs(nextWatering.value).diff(dayjs(), 'hour') / 24)
})

const isDue = computed(() => daysUntilWatering.value !== null && daysUntilWatering.value <= 0)
</script>
