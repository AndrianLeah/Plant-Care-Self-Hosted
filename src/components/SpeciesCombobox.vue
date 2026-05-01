<template>
  <!-- Trigger: selected state or closed search state -->
  <div class="relative h-[76px]">
    <!-- Selected state -->
    <button
      v-if="selectedSpecies"
      type="button"
      class="absolute inset-0 w-full flex items-center gap-4 px-4 bg-leaf-50 border border-leaf-400 rounded-2xl hover:border-leaf-500 transition-all text-left group"
      @click="openSearch"
    >
      <img
        v-if="imageMap[selectedSpecies.id]"
        :src="imageMap[selectedSpecies.id]"
        class="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <i v-else class="mdi mdi-leaf text-leaf-500 text-3xl flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-base font-semibold text-slate-900 truncate">
          {{ selectedSpecies.name }}
        </div>
        <div class="text-sm text-slate-500">
          {{ t(`difficulty.${selectedSpecies.difficulty}`) }}
        </div>
      </div>
      <i
        class="mdi mdi-pencil-outline text-slate-300 group-hover:text-slate-400 text-lg flex-shrink-0 transition-colors"
      />
    </button>

    <!-- Closed search trigger -->
    <button
      v-else
      type="button"
      class="absolute inset-0 w-full flex items-center gap-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-left"
      @click="openSearch"
    >
      <i class="mdi mdi-magnify text-slate-400 text-base flex-shrink-0" />
      <span class="flex-1 text-sm text-slate-400">{{ t('add.search_species_placeholder') }}</span>
      <i class="mdi mdi-chevron-down text-slate-300 text-base flex-shrink-0" />
    </button>
  </div>

  <!-- Fullscreen search overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isSearching"
        class="fixed inset-0 z-[210] flex flex-col bg-white"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <!-- Search input pinned to top -->
        <div
          class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-white"
          style="padding-top: max(0.75rem, env(safe-area-inset-top))"
        >
          <i class="mdi mdi-magnify text-slate-400 text-lg flex-shrink-0" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="t('add.search_species_placeholder')"
            class="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none min-w-0 py-2"
            autofocus
          />
          <button
            v-if="searchQuery"
            type="button"
            class="flex-shrink-0 text-slate-400"
            @mousedown.prevent="searchQuery = ''"
          >
            <i class="mdi mdi-close text-lg" />
          </button>
          <button
            type="button"
            class="flex-shrink-0 text-slate-500 font-medium text-sm px-2 py-1"
            @mousedown.prevent="closeSearch"
          >
            {{ t('water_guide.cancel') }}
          </button>
        </div>

        <!-- Scrollable results -->
        <div class="flex-1 overflow-y-auto">
          <template v-if="filteredSpecies.length > 0">
            <button
              v-for="s in filteredSpecies"
              :key="s.id"
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50"
              :class="
                modelValue === s.id
                  ? 'bg-leaf-50 text-leaf-700'
                  : 'text-slate-700 active:bg-slate-50'
              "
              @mousedown.prevent="selectSpecies(s)"
            >
              <img
                v-if="imageMap[s.id]"
                :src="imageMap[s.id]"
                class="w-10 h-10 rounded-xl object-cover flex-shrink-0"
              />
              <div
                v-else
                class="w-10 h-10 rounded-xl bg-leaf-100 flex items-center justify-center flex-shrink-0"
              >
                <i class="mdi mdi-leaf text-leaf-400 text-base" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold truncate">{{ s.name }}</div>
                <div class="text-xs text-slate-500 truncate italic">{{ s.scientificName }}</div>
              </div>
              <span class="text-xs text-slate-500 flex-shrink-0">
                {{ t(`difficulty.${s.difficulty}`) }}
              </span>
            </button>
          </template>
          <div v-else class="px-4 py-8 text-sm text-slate-500 text-center">
            {{ t('add.search_species_no_results') }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { find, orderBy } from 'lodash'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCatalogStore } from '../stores/catalog'
import type { CatalogSpecies } from '../types'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void
}>()

const { t } = useI18n()
const catalogStore = useCatalogStore()

const imageMap = computed(() =>
  Object.fromEntries(catalogStore.species.map((s) => [s.id, catalogStore.getImageUrl(s.id)])),
)

const searchQuery = ref('')
const searchQueryDebounced = refDebounced(searchQuery, 150)
const isSearching = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

const selectedSpecies = computed<CatalogSpecies | null>(
  () => find(catalogStore.species, { id: props.modelValue }) ?? null,
)

const filteredSpecies = computed(() => {
  const q = searchQueryDebounced.value.trim().toLowerCase()
  const base = q
    ? catalogStore.species.filter(
        (s) => s.name.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q),
      )
    : catalogStore.species
  return orderBy(base, [(s) => s.name.toLowerCase()])
})

function openSearch() {
  isSearching.value = true
  searchQuery.value = ''
  nextTick(() => searchInput.value?.focus())
}

function closeSearch() {
  isSearching.value = false
  searchQuery.value = ''
}

function selectSpecies(s: CatalogSpecies) {
  emit('update:modelValue', s.id)
  isSearching.value = false
  searchQuery.value = ''
}
</script>
