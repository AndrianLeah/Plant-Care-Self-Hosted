<template>
  <div>
    <!-- Row button -->
    <button
      class="w-full flex items-center gap-4 px-5 py-5 text-left hover:bg-slate-50 transition-colors"
      @click="$emit('toggle')"
    >
      <!-- Thumbnail -->
      <div
        class="w-24 aspect-square rounded-2xl bg-leaf-100 flex items-center justify-center overflow-hidden flex-shrink-0 self-center"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="species.name"
          loading="lazy"
          class="w-full h-full object-cover"
        />
        <i v-else class="mdi mdi-leaf text-leaf-400 text-3xl" />
      </div>

      <!-- Name + meta -->
      <div class="flex-1 min-w-0">
        <span class="text-sm font-bold text-slate-900 truncate block">
          {{ species.name }}
        </span>
        <div class="text-xs text-slate-500 italic truncate mt-0.5">
          {{ species.scientificName }}
        </div>
        <div class="flex gap-2 mt-4 flex-wrap">
          <!-- Combined pet tag when both cats & dogs share the same status -->
          <template v-if="species.safeCats === species.safeDogs">
            <span
              class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              :class="
                species.safeCats ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              "
            >
              <i class="mdi mdi-cat text-xs" />
              <i class="mdi mdi-dog text-xs" />
              {{ species.safeCats ? t('catalog.safe') : t('catalog.toxic') }}
            </span>
          </template>
          <!-- Separate tags when cats and dogs differ -->
          <template v-else>
            <span
              class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              :class="
                species.safeCats ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              "
            >
              <i class="mdi mdi-cat text-xs" />
              {{ species.safeCats ? t('catalog.safe') : t('catalog.toxic') }}
            </span>
            <span
              class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              :class="
                species.safeDogs ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              "
            >
              <i class="mdi mdi-dog text-xs" />
              {{ species.safeDogs ? t('catalog.safe') : t('catalog.toxic') }}
            </span>
          </template>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
            :style="difficultyStyle(species.difficulty)"
          >
            {{ t(`difficulty.${species.difficulty}`) }}
          </span>
        </div>
      </div>

      <i
        class="mdi text-slate-400 text-lg flex-shrink-0 self-center transition-transform duration-200"
        :class="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"
      />
    </button>

    <!-- Expanded body -->
    <Transition
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-if="isOpen" class="overflow-hidden">
        <div class="px-5 pb-5 space-y-3">
          <!-- Description -->
          <p class="text-sm text-slate-600 leading-relaxed">
            {{ species.description }}
          </p>

          <!-- Category + subcategory badges -->
          <div class="flex gap-2 flex-wrap">
            <span
              class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
              :class="
                species.category === 'ornamental'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-lime-50 text-lime-700'
              "
            >
              <i
                class="mdi text-sm"
                :class="species.category === 'ornamental' ? 'mdi-flower' : 'mdi-chef-hat'"
              />
              {{ t(`catalog.filter_category_${species.category}`) }}
            </span>
            <span
              class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
              :class="subcategoryBadgeClass(species.subcategory)"
            >
              <i class="mdi text-sm" :class="subcategoryIcon(species.subcategory)" />
              {{ t(`subcategory.${species.subcategory}`) }}
            </span>
          </div>

          <!-- Pet safety cards -->
          <div class="flex gap-2">
            <div
              class="flex-1 rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
              :class="species.safeCats ? 'bg-emerald-50' : 'bg-red-50'"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                :class="species.safeCats ? 'bg-emerald-100' : 'bg-red-100'"
              >
                <i
                  class="mdi mdi-cat text-base"
                  :class="species.safeCats ? 'text-emerald-600' : 'text-red-500'"
                />
              </div>
              <div>
                <div
                  class="text-xs font-bold"
                  :class="species.safeCats ? 'text-emerald-700' : 'text-red-600'"
                >
                  {{ t('catalog.cats') }}
                </div>
                <div
                  class="text-xs"
                  :class="species.safeCats ? 'text-emerald-500' : 'text-red-400'"
                >
                  {{ species.safeCats ? t('catalog.safe_label') : t('catalog.toxic_label') }}
                </div>
              </div>
            </div>
            <div
              class="flex-1 rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
              :class="species.safeDogs ? 'bg-emerald-50' : 'bg-red-50'"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                :class="species.safeDogs ? 'bg-emerald-100' : 'bg-red-100'"
              >
                <i
                  class="mdi mdi-dog text-base"
                  :class="species.safeDogs ? 'text-emerald-600' : 'text-red-500'"
                />
              </div>
              <div>
                <div
                  class="text-xs font-bold"
                  :class="species.safeDogs ? 'text-emerald-700' : 'text-red-600'"
                >
                  {{ t('catalog.dogs') }}
                </div>
                <div
                  class="text-xs"
                  :class="species.safeDogs ? 'text-emerald-500' : 'text-red-400'"
                >
                  {{ species.safeDogs ? t('catalog.safe_label') : t('catalog.toxic_label') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <i class="mdi mdi-water-outline text-teal-500 text-sm" />
                <span class="text-xs font-medium text-slate-500">
                  {{ t('catalog.watering') }}
                </span>
              </div>
              <div class="text-sm font-semibold text-slate-800">
                {{
                  t('catalog.every_days', {
                    min: species.wateringFrequencyDays.min,
                    max: species.wateringFrequencyDays.max,
                  })
                }}
              </div>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <i class="mdi mdi-white-balance-sunny text-amber-400 text-sm" />
                <span class="text-xs font-medium text-slate-500">{{ t('catalog.light') }}</span>
              </div>
              <div class="text-sm font-semibold text-slate-800">
                {{ t(`light.${species.light}`) }}
              </div>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <i class="mdi mdi-thermometer text-orange-400 text-sm" />
                <span class="text-xs font-medium text-slate-500">
                  {{ t('catalog.temperature') }}
                </span>
              </div>
              <div class="text-sm font-semibold text-slate-800">
                {{ species.temperatureRange.min }}–{{ species.temperatureRange.max }} °C
              </div>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <i class="mdi mdi-sprout text-emerald-500 text-sm" />
                <span class="text-xs font-medium text-slate-500">
                  {{ t('catalog.ideal_moisture') }}
                </span>
              </div>
              <div class="text-sm font-semibold text-slate-800">
                {{ t(`moisture.${species.idealMoisture}`) }}
              </div>
            </div>
            <div class="bg-slate-50 rounded-2xl px-4 py-3 col-span-2">
              <div class="flex items-center gap-1.5 mb-1.5">
                <i class="mdi mdi-cup-water text-sky-400 text-sm" />
                <span class="text-xs font-medium text-slate-500">
                  {{ t('catalog.water_hardness') }}
                </span>
              </div>
              <HardnessBadge :tolerance="species.waterHardnessTolerance" />
            </div>
          </div>

          <!-- Water tip -->
          <div class="bg-sky-50 rounded-2xl px-3 py-3 flex gap-2.5">
            <div
              class="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <i class="mdi mdi-map-marker text-sky-500 text-sm" />
            </div>
            <div>
              <div class="text-xs font-bold text-sky-600 mb-0.5">
                {{ t('catalog.rimini_tip') }}
              </div>
              <div class="text-sm text-sky-900 leading-snug">
                {{ species.waterTips }}
              </div>
            </div>
          </div>

          <!-- Add button -->
          <AppButton
            variant="primary"
            color="emerald"
            size="lg"
            full-width
            @click="$emit('add', species.id)"
          >
            <i class="mdi mdi-plus text-base" />
            {{ t('catalog.add_to_plants') }}
          </AppButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CatalogSpecies, PlantSubcategory } from '../types'
import AppButton from './AppButton.vue'
import HardnessBadge from './HardnessBadge.vue'

defineProps<{
  species: CatalogSpecies
  imageUrl: string | null
  isOpen: boolean
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'add', speciesId: string): void
}>()

const { t } = useI18n()

function difficultyStyle(d: string): Record<string, string> {
  if (d === 'easy') return { backgroundColor: '#dcfce7', color: '#15803d' }
  if (d === 'medium') return { backgroundColor: '#fef3c7', color: '#92400e' }
  return { backgroundColor: '#fee2e2', color: '#991b1b' }
}

function subcategoryIcon(sub: PlantSubcategory): string {
  if (sub === 'tropical') return 'mdi-leaf'
  if (sub === 'succulent') return 'mdi-cactus'
  if (sub === 'palm') return 'mdi-palm-tree'
  if (sub === 'orchid') return 'mdi-flower-outline'
  if (sub === 'herb') return 'mdi-sprout'
  return 'mdi-tree'
}

function subcategoryBadgeClass(sub: PlantSubcategory): string {
  if (sub === 'tropical') return 'bg-teal-50 text-teal-700'
  if (sub === 'succulent') return 'bg-amber-50 text-amber-700'
  if (sub === 'palm') return 'bg-lime-50 text-lime-700'
  if (sub === 'orchid') return 'bg-purple-50 text-purple-700'
  if (sub === 'herb') return 'bg-green-50 text-green-700'
  return 'bg-stone-100 text-stone-600'
}

// ── JS transition hooks ───────────────────────────────────────────────────────

function onEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = '0'
  e.style.transition = 'height 0.28s cubic-bezier(0.4,0,0.2,1)'
  requestAnimationFrame(() => {
    e.style.height = e.scrollHeight + 'px'
  })
}

function onAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function onLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = e.scrollHeight + 'px'
  e.style.transition = 'height 0.24s cubic-bezier(0.4,0,0.2,1)'
  requestAnimationFrame(() => {
    e.style.height = '0'
  })
}

function onAfterLeave(el: Element) {
  ;(el as HTMLElement).style.height = ''
}
</script>
