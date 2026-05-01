<template>
  <!-- Decorative header -->
  <header class="relative px-6 pt-10 pb-20 overflow-hidden">
    <div
      class="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent pointer-events-none"
    />
    <h1 class="text-4xl font-bold text-slate-900 relative">{{ t('water_guide.title') }}</h1>
    <p class="text-sm font-medium text-slate-500 mt-1 relative">{{ t('water_guide.subtitle') }}</p>
  </header>

  <main class="px-5 pt-2 space-y-5 -mt-12 relative z-10">
    <!-- Water profile card -->
    <WaterProfileCard />

    <!-- Water type guide -->
    <div class="card-glass rounded-2xl">
      <div class="px-4 pt-4 pb-2">
        <h2 class="text-sm font-bold text-slate-900">{{ t('water_guide.which_water') }}</h2>
      </div>
      <div class="px-4 pb-5 pt-3 space-y-6">
        <div v-for="option in guideOptions" :key="option.index" class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg shadow-sm"
            :style="{ backgroundColor: option.bg }"
          >
            <i :class="`mdi ${option.icon} text-lg`" :style="{ color: option.color }" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-900">
                {{ t(`water_guide.options[${option.index}].name`) }}
              </span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="option.ratingCls">
                {{ t(`water_guide.${option.ratingKey}`) }}
              </span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">
              {{ t(option.descKey, waterParams) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div class="card-glass rounded-2xl">
      <div class="px-4 pt-4 pb-2">
        <h2 class="text-sm font-bold text-slate-900">{{ tipsSectionTitle }}</h2>
      </div>
      <div class="px-4 pb-5 pt-3 space-y-6">
        <div v-for="(tipIdx, pos) in waterTipKeys" :key="tipIdx" class="flex items-start gap-3">
          <span
            class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 text-slate-600 shadow-sm"
            :style="{ background: `hsl(${195 + pos * 8}, 40%, 82%)` }"
          >
            {{ pos + 1 }}
          </span>
          <span
            class="text-sm text-slate-700"
            v-html="t(`water_guide.tips[${tipIdx}]`, waterParams)"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WaterProfileCard from '../components/WaterProfileCard.vue'
import { useWaterOptions } from '../composables/useWaterOptions'
import { useWaterProfileStore } from '../stores/waterProfile'

const { t } = useI18n()
const waterStore = useWaterProfileStore()
const { guideOptions, waterParams, levelGroup } = useWaterOptions()

const TIPS_BY_GROUP: Record<string, number[]> = {
  soft: [0, 4, 5],
  medium: [0, 1, 2, 4, 5],
  hard: [0, 1, 2, 3, 4, 5],
}

const waterTipKeys = computed(() => TIPS_BY_GROUP[levelGroup.value] ?? TIPS_BY_GROUP.hard)

const tipsSectionTitle = computed(() =>
  waterStore.profile.cityName
    ? t('water_guide.tips_title_city', { city: waterStore.profile.cityName })
    : t('water_guide.tips_title_generic'),
)
</script>
