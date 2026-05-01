<template>
  <Transition
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <div v-if="open" class="px-5 mb-3 overflow-hidden">
      <div class="bg-white/90 rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
        <!-- Difficulty -->
        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <i class="mdi mdi-chart-bar text-slate-400 text-sm" />
            <span class="text-sm font-medium text-slate-500">
              {{ t('catalog.filter_difficulty') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              v-for="d in DIFFICULTIES"
              :key="d"
              variant="custom"
              size="sm"
              :class="difficultyChipClass(d)"
              @click="toggleDifficulty(d)"
            >
              <i class="mdi text-sm" :class="difficultyIcon(d)" />
              {{ t(`difficulty.${d}`) }}
              <i v-if="selectedDifficulty.includes(d)" class="mdi mdi-check text-[11px] -mr-0.5" />
            </AppButton>
          </div>
        </div>

        <!-- Water type -->
        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <i class="mdi mdi-water-outline text-slate-400 text-sm" />
            <span class="text-sm font-medium text-slate-500">
              {{ t('catalog.filter_water') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              v-for="w in WATER_TYPES"
              :key="w"
              variant="custom"
              size="sm"
              :class="waterChipClass(w)"
              @click="toggleWater(w)"
            >
              <i class="mdi text-sm" :class="waterIcon(w)" />
              {{ t(`hardness.${w}`) }}
              <i v-if="selectedWater.includes(w)" class="mdi mdi-check text-[11px] -mr-0.5" />
            </AppButton>
          </div>
        </div>

        <!-- Pet safety -->
        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <i class="mdi mdi-paw text-slate-400 text-sm" />
            <span class="text-sm font-medium text-slate-500">
              {{ t('catalog.filter_pets') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              variant="custom"
              size="sm"
              :class="
                petFilter.includes('cats')
                  ? 'bg-teal-100 border border-teal-300 text-teal-700'
                  : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
              "
              @click="togglePetFilter('cats')"
            >
              <i class="mdi mdi-cat text-sm" />
              {{ t('catalog.filter_safe_cats') }}
              <i v-if="petFilter.includes('cats')" class="mdi mdi-check text-[11px] -mr-0.5" />
            </AppButton>
            <AppButton
              variant="custom"
              size="sm"
              :class="
                petFilter.includes('dogs')
                  ? 'bg-teal-100 border border-teal-300 text-teal-700'
                  : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
              "
              @click="togglePetFilter('dogs')"
            >
              <i class="mdi mdi-dog text-sm" />
              {{ t('catalog.filter_safe_dogs') }}
              <i v-if="petFilter.includes('dogs')" class="mdi mdi-check text-[11px] -mr-0.5" />
            </AppButton>
          </div>
        </div>

        <!-- Category -->
        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <i class="mdi mdi-tag-outline text-slate-400 text-sm" />
            <span class="text-sm font-medium text-slate-500">
              {{ t('catalog.filter_category') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              variant="custom"
              size="sm"
              :class="
                selectedCategory.includes('ornamental')
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
              "
              @click="toggleCategory('ornamental')"
            >
              <i class="mdi mdi-flower text-sm" />
              {{ t('catalog.filter_category_ornamental') }}
              <i
                v-if="selectedCategory.includes('ornamental')"
                class="mdi mdi-check text-[11px] -mr-0.5"
              />
            </AppButton>
            <AppButton
              variant="custom"
              size="sm"
              :class="
                selectedCategory.includes('culinary')
                  ? 'bg-lime-100 border border-lime-300 text-lime-700'
                  : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
              "
              @click="toggleCategory('culinary')"
            >
              <i class="mdi mdi-chef-hat text-sm" />
              {{ t('catalog.filter_category_culinary') }}
              <i
                v-if="selectedCategory.includes('culinary')"
                class="mdi mdi-check text-[11px] -mr-0.5"
              />
            </AppButton>
          </div>
        </div>

        <!-- Subcategory -->
        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <i class="mdi mdi-shape-outline text-slate-400 text-sm" />
            <span class="text-sm font-medium text-slate-500">
              {{ t('catalog.filter_subcategory') }}
            </span>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton
              v-for="sub in SUBCATEGORIES"
              :key="sub"
              variant="custom"
              size="sm"
              :class="subcategoryChipClass(sub)"
              @click="toggleSubcategory(sub)"
            >
              <i class="mdi text-sm" :class="subcategoryIcon(sub)" />
              {{ t(`subcategory.${sub}`) }}
              <i
                v-if="selectedSubcategory.includes(sub)"
                class="mdi mdi-check text-[11px] -mr-0.5"
              />
            </AppButton>
          </div>
        </div>

        <!-- Clear filters -->
        <Transition name="fade-fast">
          <div v-if="hasFilters" class="pt-1 flex items-center justify-between">
            <span class="text-xs text-slate-400">
              {{ activeFilterCount }} {{ activeFilterCount === 1 ? 'filter' : 'filters' }} active
            </span>
            <AppButton
              variant="custom"
              size="sm"
              class="bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              @click="clearFilters"
            >
              <i class="mdi mdi-close text-sm" />
              {{ t('catalog.clear_filters') }}
            </AppButton>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { xor } from 'lodash'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PlantSubcategory, WaterHardnessTolerance } from '../types'
import AppButton from './AppButton.vue'

export interface FilterState {
  difficulty: string[]
  water: WaterHardnessTolerance[]
  pets: ('cats' | 'dogs')[]
  category: ('ornamental' | 'culinary')[]
  subcategory: PlantSubcategory[]
}

defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: 'change', filters: FilterState): void
}>()

const { t } = useI18n()

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
const WATER_TYPES: WaterHardnessTolerance[] = ['soft-only', 'soft-preferred', 'tolerant', 'any']
const SUBCATEGORIES: PlantSubcategory[] = [
  'tropical',
  'succulent',
  'palm',
  'orchid',
  'herb',
  'tree',
]

const selectedDifficulty = ref<string[]>([])
const selectedWater = ref<WaterHardnessTolerance[]>([])
const petFilter = ref<('cats' | 'dogs')[]>([])
const selectedCategory = ref<('ornamental' | 'culinary')[]>([])
const selectedSubcategory = ref<PlantSubcategory[]>([])

const hasFilters = computed(
  () =>
    selectedDifficulty.value.length > 0 ||
    selectedWater.value.length > 0 ||
    petFilter.value.length > 0 ||
    selectedCategory.value.length > 0 ||
    selectedSubcategory.value.length > 0,
)

const activeFilterCount = computed(
  () =>
    selectedDifficulty.value.length +
    selectedWater.value.length +
    petFilter.value.length +
    selectedCategory.value.length +
    selectedSubcategory.value.length,
)

function emitChange() {
  emit('change', {
    difficulty: selectedDifficulty.value,
    water: selectedWater.value,
    pets: petFilter.value,
    category: selectedCategory.value,
    subcategory: selectedSubcategory.value,
  })
}

function toggleDifficulty(d: string) {
  selectedDifficulty.value = xor(selectedDifficulty.value, [d])
  emitChange()
}

function toggleWater(w: WaterHardnessTolerance) {
  selectedWater.value = xor(selectedWater.value, [w])
  emitChange()
}

function togglePetFilter(type: 'cats' | 'dogs') {
  petFilter.value = xor(petFilter.value, [type])
  emitChange()
}

function toggleCategory(cat: 'ornamental' | 'culinary') {
  selectedCategory.value = xor(selectedCategory.value, [cat])
  emitChange()
}

function toggleSubcategory(sub: PlantSubcategory) {
  selectedSubcategory.value = xor(selectedSubcategory.value, [sub])
  emitChange()
}

function clearFilters() {
  selectedDifficulty.value = []
  selectedWater.value = []
  petFilter.value = []
  selectedCategory.value = []
  selectedSubcategory.value = []
  emitChange()
}

// ── Styling helpers ───────────────────────────────────────────────────────────

function difficultyChipClass(d: string): string {
  if (!selectedDifficulty.value.includes(d))
    return 'border bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
  if (d === 'easy') return 'border bg-emerald-100 border-emerald-300 text-emerald-700'
  if (d === 'medium') return 'border bg-amber-100 border-amber-300 text-amber-700'
  return 'border bg-red-100 border-red-300 text-red-700'
}

function difficultyIcon(d: string): string {
  if (d === 'easy') return 'mdi-sprout'
  if (d === 'medium') return 'mdi-leaf'
  return 'mdi-tree'
}

function waterIcon(w: WaterHardnessTolerance): string {
  if (w === 'soft-only') return 'mdi-water-minus'
  if (w === 'soft-preferred') return 'mdi-water-minus-outline'
  if (w === 'tolerant') return 'mdi-water'
  return 'mdi-water-check'
}

function waterChipClass(w: WaterHardnessTolerance): string {
  if (!selectedWater.value.includes(w))
    return 'border bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
  if (w === 'soft-only') return 'border bg-cyan-100 border-cyan-300 text-cyan-700'
  if (w === 'soft-preferred') return 'border bg-sky-100 border-sky-300 text-sky-700'
  if (w === 'tolerant') return 'border bg-blue-100 border-blue-300 text-blue-700'
  return 'border bg-indigo-100 border-indigo-300 text-indigo-700'
}

function subcategoryIcon(sub: PlantSubcategory): string {
  if (sub === 'tropical') return 'mdi-leaf'
  if (sub === 'succulent') return 'mdi-cactus'
  if (sub === 'palm') return 'mdi-palm-tree'
  if (sub === 'orchid') return 'mdi-flower-outline'
  if (sub === 'herb') return 'mdi-sprout'
  return 'mdi-tree'
}

function subcategoryChipClass(sub: PlantSubcategory): string {
  if (!selectedSubcategory.value.includes(sub))
    return 'border bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
  if (sub === 'tropical') return 'border bg-teal-100 border-teal-300 text-teal-700'
  if (sub === 'succulent') return 'border bg-amber-100 border-amber-300 text-amber-700'
  if (sub === 'palm') return 'border bg-lime-100 border-lime-300 text-lime-700'
  if (sub === 'orchid') return 'border bg-purple-100 border-purple-300 text-purple-700'
  if (sub === 'herb') return 'border bg-green-100 border-green-300 text-green-700'
  return 'border bg-stone-100 border-stone-300 text-stone-600'
}

// ── JS transition hooks ───────────────────────────────────────────────────────

function onEnter(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.height = '0'
  e.style.marginBottom = '0'
  e.style.opacity = '0'
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.transition =
      'height 0.28s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease'
    requestAnimationFrame(() => {
      e.style.height = e.scrollHeight + 'px'
      e.style.marginBottom = ''
      e.style.opacity = '1'
      const handler = (ev: Event) => {
        if (ev.target === e && (ev as TransitionEvent).propertyName === 'height') {
          done()
          e.removeEventListener('transitionend', handler)
        }
      }
      e.addEventListener('transitionend', handler)
    })
  })
}

function onAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
  e.style.transition = ''
}

function onLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.height = e.scrollHeight + 'px'
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.transition =
      'height 0.24s cubic-bezier(0.4,0,0.2,1), margin-bottom 0.24s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease'
    requestAnimationFrame(() => {
      e.style.height = '0'
      e.style.marginBottom = '0'
      e.style.opacity = '0'
      const handler = (ev: Event) => {
        if (ev.target === e && (ev as TransitionEvent).propertyName === 'height') {
          done()
          e.removeEventListener('transitionend', handler)
        }
      }
      e.addEventListener('transitionend', handler)
    })
  })
}

function onAfterLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
  e.style.transition = ''
}
</script>
