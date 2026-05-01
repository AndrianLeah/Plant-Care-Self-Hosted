<template>
  <!-- Header -->
  <header class="relative px-6 pt-10 pb-20 overflow-hidden">
    <div
      class="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-transparent pointer-events-none"
    />
    <!-- Title row -->
    <div class="relative min-w-0">
      <h1 class="text-4xl font-bold text-slate-900 whitespace-nowrap">
        {{ t('catalog.title') }}
      </h1>
      <p class="text-sm font-medium text-slate-500 mt-1">
        {{
          filtered.length === catalogStore.speciesCount
            ? t('catalog.subtitle', { count: catalogStore.speciesCount })
            : t('catalog.subtitle_filtered', {
                shown: filtered.length,
                total: catalogStore.speciesCount,
              })
        }}
      </p>
    </div>
  </header>

  <div class="-mt-12 pt-2">
    <!-- Search + Filters row -->
    <div class="relative px-5 mb-3 flex items-center gap-2">
      <div class="relative flex-1">
        <i
          class="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
        />
        <input
          v-model="searchQuery"
          type="search"
          :placeholder="t('catalog.search_placeholder')"
          class="w-full pl-9 pr-4 py-2 rounded-full text-sm bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 placeholder-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
        />
      </div>
      <AppButton
        variant="custom"
        size="sm"
        class="flex-shrink-0 bg-white/80 backdrop-blur-sm"
        :class="
          filtersOpen || hasFilters
            ? 'border border-slate-800 text-slate-800'
            : 'border border-slate-200 text-slate-500 hover:border-slate-300'
        "
        @click="filtersOpen = !filtersOpen"
      >
        <i class="mdi mdi-tune-variant text-sm" />
        {{ t('catalog.filters') }}
        <span
          v-if="hasFilters"
          class="bg-teal-100 text-teal-700 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold leading-none"
        >
          {{ activeFilterCount }}
        </span>
      </AppButton>
    </div>

    <CatalogFilters :open="filtersOpen" @change="onFiltersChange" />

    <main class="px-5 pt-3">
      <div v-if="filtered.length === 0" class="card-glass rounded-2xl p-8 text-center">
        <i class="mdi mdi-filter-off-outline text-4xl text-slate-300 mb-2 block" />
        <p class="text-sm text-slate-500">{{ t('catalog.no_results') }}</p>
      </div>

      <div v-else class="card-glass rounded-2xl overflow-hidden">
        <CatalogSpeciesRow
          v-for="s in visible"
          :key="s.id"
          :species="s"
          :image-url="imageUrls[s.id] ?? null"
          :is-open="openId === s.id"
          @toggle="openId = openId === s.id ? null : s.id"
          @add="openAddSheet"
        />
        <div v-if="visible.length < filtered.length" ref="sentinel" class="h-12" />
      </div>
    </main>
  </div>

  <AddPlantSheet v-model="showAddSheet" :species-id="addSpeciesId ?? undefined" />
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { orderBy } from 'lodash'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddPlantSheet from '../components/AddPlantSheet.vue'
import AppButton from '../components/AppButton.vue'
import type { FilterState } from '../components/CatalogFilters.vue'
import CatalogFilters from '../components/CatalogFilters.vue'
import CatalogSpeciesRow from '../components/CatalogSpeciesRow.vue'
import { useCatalogStore } from '../stores/catalog'

const PAGE_SIZE = 15

const { t } = useI18n()
const catalogStore = useCatalogStore()
const openId = ref<string | null>(null)
const filtersOpen = ref(false)
const searchQuery = ref('')
const sentinel = ref<HTMLElement | null>(null)
const visibleCount = ref(PAGE_SIZE)
const showAddSheet = ref(false)
const addSpeciesId = ref<string | null>(null)

function openAddSheet(speciesId: string) {
  addSpeciesId.value = speciesId
  showAddSheet.value = true
}

useIntersectionObserver(sentinel, ([entry]) => {
  if (entry?.isIntersecting) visibleCount.value += PAGE_SIZE
})

const imageUrls = computed(() =>
  Object.fromEntries(visible.value.map((s) => [s.id, catalogStore.getImageUrl(s.id)])),
)

// ── Filter state (owned by CatalogFilters, reflected here for filtered computed) ──
const currentFilters = ref<FilterState>({
  difficulty: [],
  water: [],
  pets: [],
  category: [],
  subcategory: [],
})

function onFiltersChange(filters: FilterState) {
  currentFilters.value = filters
}

// Reset visible count when filters/search change
watch([searchQuery, () => JSON.stringify(currentFilters.value)], () => {
  visibleCount.value = PAGE_SIZE
})

const hasFilters = computed(
  () =>
    currentFilters.value.difficulty.length > 0 ||
    currentFilters.value.water.length > 0 ||
    currentFilters.value.pets.length > 0 ||
    currentFilters.value.category.length > 0 ||
    currentFilters.value.subcategory.length > 0,
)

const activeFilterCount = computed(
  () =>
    currentFilters.value.difficulty.length +
    currentFilters.value.water.length +
    currentFilters.value.pets.length +
    currentFilters.value.category.length +
    currentFilters.value.subcategory.length,
)

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return orderBy(
    catalogStore.species.filter((s) => {
      // Search filter
      if (q) {
        const name = s.name.toLowerCase()
        const sci = s.scientificName.toLowerCase()
        if (!name.includes(q) && !sci.includes(q)) return false
      }
      // Panel filters
      const f = currentFilters.value
      if (f.difficulty.length > 0 && !f.difficulty.includes(s.difficulty)) return false
      if (f.water.length > 0 && !f.water.includes(s.waterHardnessTolerance)) return false
      if (f.pets.includes('cats') && !s.safeCats) return false
      if (f.pets.includes('dogs') && !s.safeDogs) return false
      if (f.category.length > 0 && !f.category.includes(s.category)) return false
      if (f.subcategory.length > 0 && !f.subcategory.includes(s.subcategory)) return false
      return true
    }),
    [(s) => s.name.toLowerCase()],
  )
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))
</script>
