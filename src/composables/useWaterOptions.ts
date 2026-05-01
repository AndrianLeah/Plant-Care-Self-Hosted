import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWaterProfileStore } from '../stores/waterProfile'
import type { WaterHardnessTolerance } from '../types'

export const WATER_OPTION_ICONS = [
  { icon: 'mdi-weather-rainy', bg: '#dbeafe', color: '#1d4ed8' },
  { icon: 'mdi-flask-outline', bg: '#cffafe', color: '#0e7490' },
  { icon: 'mdi-filter-outline', bg: '#ede9fe', color: '#6d28d9' },
  { icon: 'mdi-faucet', bg: '#fef3c7', color: '#b45309' },
  { icon: 'mdi-alert-outline', bg: '#fee2e2', color: '#dc2626' },
]

const RATINGS_BY_LEVEL: Record<string, string[]> = {
  'very-soft': ['rating_best', 'rating_fine', 'rating_fine', 'rating_best', 'rating_temp_risk'],
  soft: ['rating_best', 'rating_fine', 'rating_fine', 'rating_best', 'rating_temp_risk'],
  'moderately-hard': [
    'rating_best',
    'rating_excellent',
    'rating_good',
    'rating_acceptable',
    'rating_temp_risk',
  ],
  hard: ['rating_best', 'rating_essential', 'rating_good', 'rating_avoid', 'rating_avoid'],
  'very-hard': ['rating_best', 'rating_essential', 'rating_good', 'rating_avoid', 'rating_avoid'],
}

export const RATING_CLASSES: Record<string, string> = {
  rating_best: 'bg-emerald-50 text-emerald-700',
  rating_excellent: 'bg-green-50 text-green-700',
  rating_essential: 'bg-violet-50 text-violet-700',
  rating_good: 'bg-teal-50 text-teal-700',
  rating_fine: 'bg-sky-50 text-sky-600',
  rating_acceptable: 'bg-amber-50 text-amber-700',
  rating_sparingly: 'bg-orange-50 text-orange-700',
  rating_temp_risk: 'bg-orange-50 text-orange-700',
  rating_avoid: 'bg-red-50 text-red-600',
}

// Keys that are considered "OK" for plant detail badges
const OK_RATINGS = new Set([
  'rating_best',
  'rating_excellent',
  'rating_fine',
  'rating_good',
  'rating_acceptable',
  'rating_temp_risk',
])

export function useWaterOptions() {
  const waterStore = useWaterProfileStore()
  const { t } = useI18n()

  const levelGroup = computed(() => {
    const l = waterStore.profile.level
    if (l === 'very-soft' || l === 'soft') return 'soft'
    if (l === 'moderately-hard') return 'medium'
    return 'hard'
  })

  const waterParams = computed(() => ({
    city: waterStore.profile.cityName || t('detail.your_tap'),
    mgL: Math.round(waterStore.displayMgL),
  }))

  /** Full list with icon, rating badge, and description — for the Water Guide */
  const guideOptions = computed(() =>
    WATER_OPTION_ICONS.map((icon, i) => {
      const ratingKey = (RATINGS_BY_LEVEL[waterStore.profile.level] ??
        RATINGS_BY_LEVEL['very-hard'])[i]
      return {
        ...icon,
        index: i,
        ratingKey,
        ratingCls: RATING_CLASSES[ratingKey],
        descKey: `water_guide.options[${i}].desc_${levelGroup.value}` as const,
      }
    }),
  )

  /** Simple ok/not-ok badges — for Plant Detail, based on plant tolerance */
  function plantWaterBadges(
    tolerance: WaterHardnessTolerance | undefined,
    tapOk: boolean,
    coldWaterSensitive: boolean,
  ) {
    return computed(() => {
      const tol = tolerance ?? 'any'
      const ratings = RATINGS_BY_LEVEL[waterStore.profile.level] ?? RATINGS_BY_LEVEL['very-hard']
      const filteredOk = tapOk || tol !== 'soft-only'
      const coldTapOk = !coldWaterSensitive && (tol === 'any' || OK_RATINGS.has(ratings[4]))
      return [
        {
          key: 'rainwater',
          labelKey: 'detail.water_opt_rainwater',
          ok: true,
          ratingKey: ratings[0],
          ratingCls: RATING_CLASSES[ratings[0]],
        },
        {
          key: 'distilled',
          labelKey: 'detail.water_opt_distilled',
          ok: true,
          ratingKey: ratings[1],
          ratingCls: RATING_CLASSES[ratings[1]],
        },
        {
          key: 'filtered',
          labelKey: 'detail.water_opt_filtered',
          ok: filteredOk,
          ratingKey: ratings[2],
          ratingCls: RATING_CLASSES[ratings[2]],
        },
        {
          key: 'tap',
          labelKey: 'detail.water_opt_tap',
          ok: tapOk,
          ratingKey: ratings[3],
          ratingCls: RATING_CLASSES[ratings[3]],
        },
        {
          key: 'hard-tap',
          labelKey: 'detail.water_opt_hard_tap',
          ok: coldTapOk,
          ratingKey: ratings[4],
          ratingCls: RATING_CLASSES[ratings[4]],
        },
      ]
    })
  }

  return { levelGroup, waterParams, guideOptions, plantWaterBadges }
}
