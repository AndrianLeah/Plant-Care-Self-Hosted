<template>
  <div class="card-glass rounded-2xl p-4">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <i class="mdi mdi-water text-2xl" :class="profileIconClass" />
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold text-slate-900">{{ profileTitle }}</div>
        <div class="text-xs text-slate-500">{{ t('water_guide.profile_setup_hint') }}</div>
      </div>
      <AppButton v-if="!editing" variant="glass" color="slate" size="sm" @click="startEdit">
        <i class="mdi mdi-pencil-outline text-sm" />
        {{ t('water_guide.edit') }}
      </AppButton>
    </div>
    <div class="grid grid-cols-3 my-4">
      <div class="flex flex-col items-center justify-center px-1 py-4 text-center">
        <div class="text-base font-bold leading-snug" :class="hardnessBadgeClass">
          {{ t(`water_guide.hardness_badge.${waterStore.profile.level}`) }}
        </div>
        <div class="text-xs text-slate-500 mt-1.5">
          {{
            waterStore.profile.hardnessMgL
              ? displayMgLLabel + ' mg/L'
              : LEVEL_RANGES[waterStore.profile.level]
          }}
        </div>
      </div>
      <div
        class="flex flex-col items-center justify-center px-1 py-4 text-center border-x border-slate-100"
      >
        <div class="text-base font-bold text-amber-600 leading-snug">{{ phLabel }}</div>
        <div class="text-xs text-slate-500 mt-1.5">
          {{ waterStore.profile.ph ? 'pH ' + displayPhLabel : 'pH n/a' }}
        </div>
      </div>
      <div class="flex flex-col items-center justify-center px-1 py-4 text-center">
        <div class="text-base font-bold text-amber-700 leading-snug">
          {{ t(`water_guide.mineral_label.${waterStore.profile.level}`) }}
        </div>
        <div class="text-xs text-slate-500 mt-1.5">
          {{
            waterStore.profile.caMgL || waterStore.profile.mgMgL
              ? caMgLabel + ' mg/L'
              : t(`water_guide.mineral_sublabel.${waterStore.profile.level}`)
          }}
        </div>
      </div>
    </div>
    <div
      class="text-sm text-slate-600 leading-relaxed"
      v-html="t(`water_guide.level_desc.${waterStore.profile.level}`)"
    />
  </div>

  <!-- Edit mode: full-screen overlay (covers bottom nav and keyboard) -->
  <Teleport to="body">
    <Transition name="slide-up">
      <div
        v-if="editing"
        class="fixed inset-0 z-[200] flex flex-col bg-slate-50"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <!-- Sticky header -->
        <div
          class="flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex-shrink-0"
          style="padding-top: max(1rem, env(safe-area-inset-top))"
        >
          <div class="flex items-center gap-2">
            <i class="mdi mdi-water text-xl" :class="profileIconClass" />
            <span class="text-base font-bold text-slate-900">{{ profileTitle }}</span>
          </div>
          <button
            class="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            @click="cancelEdit"
          >
            <i class="mdi mdi-close text-xl" />
          </button>
        </div>

        <!-- Scrollable form body -->
        <div class="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <!-- City name field -->
          <div>
            <label class="text-sm font-medium text-slate-500 block mb-1.5">
              {{ t('water_guide.field_city') }}
            </label>
            <input
              v-model="editCity"
              type="text"
              :placeholder="t('water_guide.field_city_placeholder')"
              class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-shadow"
            />

            <!-- City database combobox -->
            <p class="text-center text-[11px] text-slate-500 my-2">
              {{ t('water_guide.select_city_db') }}
            </p>

            <!-- Selected city chip -->
            <button
              v-if="selectedCityPreset && !isSearchingCity"
              class="w-full flex items-center gap-3 px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-2xl hover:bg-cyan-100 transition-colors text-left group"
              @click="openCitySearch"
            >
              <i class="mdi mdi-database-check-outline text-cyan-500 text-base flex-shrink-0" />
              <span class="flex-1 text-sm font-semibold text-slate-800 min-w-0 truncate">
                {{ selectedCityPreset.name }}
              </span>
              <span class="text-xs text-slate-500 flex-shrink-0">
                {{ selectedCityPreset.region }}
              </span>
              <span class="text-xs font-semibold text-slate-500 flex-shrink-0 ml-1">
                {{ selectedCityPreset.hardnessMgL }} mg/L
              </span>
              <i
                class="mdi mdi-close text-slate-400 text-base flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                @click.stop="clearSelectedCity"
              />
            </button>

            <!-- Search trigger (closed state) -->
            <button
              v-else
              class="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl transition-all text-left"
              @click="openCitySearch"
            >
              <i class="mdi mdi-database-search-outline text-slate-400 text-base flex-shrink-0" />
              <span class="flex-1 text-sm text-slate-400 min-w-0">
                {{ t('water_guide.select_city_placeholder') }}
              </span>
              <i class="mdi mdi-chevron-down text-slate-300 text-base flex-shrink-0" />
            </button>
          </div>

          <!-- Hardness level chips -->
          <div>
            <div class="text-sm font-medium text-slate-500 mb-3">
              {{ t('water_guide.hardness_level') }}
            </div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
              <button
                v-for="level in HARDNESS_LEVELS"
                :key="level"
                class="w-full inline-flex flex-col items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95"
                :class="
                  editLevel === level
                    ? levelChipActiveClass(level)
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                "
                @click="selectPreset(level)"
              >
                <span class="flex items-center gap-1">
                  <i class="mdi text-sm" :class="levelIcon(level)" />
                  {{ t(`water_guide.levels.${level}`) }}
                  <i v-if="editLevel === level" class="mdi mdi-check text-[11px]" />
                </span>
                <span class="text-[10px] font-normal opacity-60 mt-0.5">
                  {{ LEVEL_RANGES[level] }}
                </span>
              </button>
            </div>
          </div>

          <!-- Precise values toggle + fields grouped together -->
          <div>
            <button
              class="flex items-center gap-2 w-full text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors py-3 px-1"
              @click="showAdvanced = !showAdvanced"
            >
              <i
                class="mdi text-base transition-transform"
                :class="showAdvanced ? 'mdi-chevron-down' : 'mdi-chevron-right'"
              />
              {{ t('water_guide.advanced_label') }}
            </button>

            <Transition
              @before-enter="onAdvancedBeforeEnter"
              @enter="onAdvancedEnter"
              @after-enter="onAdvancedAfterEnter"
              @before-leave="onAdvancedBeforeLeave"
              @leave="onAdvancedLeave"
              @after-leave="onAdvancedAfterLeave"
            >
              <div v-if="showAdvanced" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-500 block mb-2">
                    {{ t('water_guide.field_mgl') }}
                  </label>
                  <input
                    v-model.number="editMgL"
                    type="number"
                    min="0"
                    max="2000"
                    :placeholder="t('water_guide.field_mgl_placeholder')"
                    class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-shadow"
                    @input="onMgLInput"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 block mb-2">
                    {{ t('water_guide.field_ph') }}
                  </label>
                  <input
                    v-model.number="editPh"
                    type="number"
                    min="0"
                    max="14"
                    step="0.1"
                    :placeholder="t('water_guide.field_ph_placeholder')"
                    class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 block mb-2">
                    {{ t('water_guide.field_ca') }}
                  </label>
                  <input
                    v-model.number="editCa"
                    type="number"
                    min="0"
                    max="500"
                    :placeholder="t('water_guide.field_ca_placeholder')"
                    class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-500 block mb-2">
                    {{ t('water_guide.field_mg') }}
                  </label>
                  <input
                    v-model.number="editMg"
                    type="number"
                    min="0"
                    max="200"
                    :placeholder="t('water_guide.field_mg_placeholder')"
                    class="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </Transition>
          </div>

          <!-- Action buttons -->
          <p v-if="saveError" class="text-sm text-red-600 -mt-2">{{ saveError }}</p>
          <div class="flex gap-2 pb-4">
            <AppButton
              variant="primary"
              color="cyan"
              size="md"
              full-width
              :disabled="!canSave || savingProfile"
              @click="saveProfile"
            >
              <i v-if="savingProfile" class="mdi mdi-loading mdi-spin text-sm" />
              {{ t('water_guide.save') }}
            </AppButton>
            <AppButton
              variant="outline"
              color="slate"
              size="md"
              :disabled="savingProfile"
              @click="cancelEdit"
            >
              {{ t('water_guide.cancel') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- City search: fullscreen overlay above the edit overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isSearchingCity"
        class="fixed inset-0 z-[210] flex flex-col bg-white"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <!-- Search input pinned to top -->
        <div
          class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-white"
          style="padding-top: max(0.75rem, env(safe-area-inset-top))"
        >
          <i class="mdi mdi-database-search-outline text-slate-400 text-lg flex-shrink-0" />
          <input
            ref="citySearchInput"
            v-model="citySearch"
            type="text"
            :placeholder="t('water_guide.select_city_placeholder')"
            class="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none min-w-0 py-2"
            autofocus
          />
          <button
            v-if="citySearch"
            class="flex-shrink-0 text-slate-400"
            @mousedown.prevent="citySearch = ''"
          >
            <i class="mdi mdi-close text-lg" />
          </button>
          <button
            class="flex-shrink-0 text-slate-500 font-medium text-sm px-2 py-1"
            @mousedown.prevent="closeCitySearch"
          >
            {{ t('water_guide.cancel') }}
          </button>
        </div>

        <!-- Scrollable results -->
        <div class="flex-1 overflow-y-auto">
          <template v-if="filteredCityGroups.length > 0">
            <template v-for="group in filteredCityGroups" :key="group.region">
              <div
                class="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-slate-50 sticky top-0 z-10"
              >
                {{ group.region }}
              </div>
              <button
                v-for="city in group.cities"
                :key="city.name"
                class="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors border-b border-slate-50"
                :class="
                  editCity === city.name
                    ? 'text-cyan-700 font-semibold bg-cyan-50'
                    : 'text-slate-700 active:bg-slate-50'
                "
                @mousedown.prevent="selectCity(city)"
              >
                <span>{{ city.name }}</span>
                <span class="text-xs text-slate-500 ml-2 flex-shrink-0">
                  {{ city.hardnessMgL }} mg/L
                </span>
              </button>
            </template>
          </template>
          <div v-else class="px-4 py-8 text-sm text-slate-500 text-center">
            {{ t('water_guide.select_city_no_results') }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { filter, find, flatMap } from 'lodash'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ItalianCityPreset } from '../stores/waterProfile'
import { HARDNESS_LEVELS, LEVEL_RANGES, useWaterProfileStore } from '../stores/waterProfile'
import type { WaterHardnessLevel } from '../types'
import AppButton from './AppButton.vue'

const { t } = useI18n()
const waterStore = useWaterProfileStore()

// ── Display computed ──────────────────────────────────────────────────────────

const profileTitle = computed(() =>
  waterStore.profile.cityName
    ? t('water_guide.profile_card_title_city', { city: waterStore.profile.cityName })
    : t('water_guide.profile_card_title'),
)

const displayMgLLabel = computed(() => {
  const v = waterStore.displayMgL
  return waterStore.profile.hardnessMgL ? String(v) : `~${v}`
})

const displayPhLabel = computed(() => {
  const v = waterStore.displayPh
  return waterStore.profile.ph ? String(v) : `~${v}`
})

const caMgLabel = computed(() => {
  const ca = waterStore.profile.caMgL ?? waterStore.displayCa
  const mg = waterStore.profile.mgMgL ?? waterStore.displayMg
  const prefix = waterStore.profile.caMgL || waterStore.profile.mgMgL ? '' : '~'
  return `${prefix}${ca} / ${prefix}${mg}`
})

const phLabel = computed(() => {
  const ph = waterStore.displayPh
  if (ph < 7) return t('water_guide.ph_acidic')
  if (ph <= 7.4) return t('water_guide.ph_neutral')
  return t('water_guide.ph_alkaline')
})

const profileIconClass = computed(() => {
  const map: Record<WaterHardnessLevel, string> = {
    'very-soft': 'text-sky-500',
    soft: 'text-emerald-500',
    'moderately-hard': 'text-cyan-600',
    hard: 'text-amber-600',
    'very-hard': 'text-orange-600',
  }
  return map[waterStore.profile.level]
})

const hardnessBadgeClass = computed(() => {
  const map: Record<WaterHardnessLevel, string> = {
    'very-soft': 'text-sky-600',
    soft: 'text-emerald-600',
    'moderately-hard': 'text-cyan-700',
    hard: 'text-amber-700',
    'very-hard': 'text-red-600',
  }
  return map[waterStore.profile.level]
})

// ── Edit state ────────────────────────────────────────────────────────────────

const editing = ref(false)
const showAdvanced = ref(false)
const savingProfile = ref(false)
const saveError = ref<string | null>(null)
const editLevel = ref<WaterHardnessLevel | null>(null)
const editCity = ref('')
const editMgL = ref<number | undefined>(undefined)
const editPh = ref<number | undefined>(undefined)
const editCa = ref<number | undefined>(undefined)
const editMg = ref<number | undefined>(undefined)

const citySearch = ref('')
const citySearchDebounced = refDebounced(citySearch, 150)
const isSearchingCity = ref(false)
const citySearchInput = ref<HTMLInputElement | null>(null)

const selectedCityPreset = computed(
  () => find(flatMap(waterStore.cityPresetsByRegion, 'cities'), { name: editCity.value }) ?? null,
)

const filteredCityGroups = computed(() => {
  const q = citySearchDebounced.value.toLowerCase().trim()
  if (!q) return waterStore.cityPresetsByRegion
  return filter(
    waterStore.cityPresetsByRegion.map((g) => ({
      region: g.region,
      cities: g.cities.filter(
        (c) => c.name.toLowerCase().includes(q) || g.region.toLowerCase().includes(q),
      ),
    })),
    (g) => g.cities.length > 0,
  )
})

const canSave = computed(() => editCity.value.trim().length > 0 && editLevel.value !== null)

// ── Hardness helpers ──────────────────────────────────────────────────────────

function levelFromMgL(mgL: number): WaterHardnessLevel {
  if (mgL < 40) return 'very-soft'
  if (mgL < 75) return 'soft'
  if (mgL < 150) return 'moderately-hard'
  if (mgL < 300) return 'hard'
  return 'very-hard'
}

function levelChipActiveClass(level: WaterHardnessLevel): string {
  const map: Record<WaterHardnessLevel, string> = {
    'very-soft': 'bg-sky-100 border-sky-300 text-sky-700',
    soft: 'bg-emerald-100 border-emerald-300 text-emerald-700',
    'moderately-hard': 'bg-cyan-100 border-cyan-300 text-cyan-700',
    hard: 'bg-amber-100 border-amber-300 text-amber-700',
    'very-hard': 'bg-red-100 border-red-300 text-red-700',
  }
  return map[level]
}

function levelIcon(level: WaterHardnessLevel): string {
  const map: Record<WaterHardnessLevel, string> = {
    'very-soft': 'mdi-water-minus',
    soft: 'mdi-water-minus-outline',
    'moderately-hard': 'mdi-water',
    hard: 'mdi-water-plus-outline',
    'very-hard': 'mdi-water-plus',
  }
  return map[level]
}

// ── Edit actions ──────────────────────────────────────────────────────────────

function onMgLInput() {
  if (editMgL.value && editMgL.value > 0) {
    editLevel.value = levelFromMgL(editMgL.value)
  }
}

function selectCity(city: ItalianCityPreset) {
  editCity.value = city.name
  editLevel.value = city.level
  editMgL.value = city.hardnessMgL
  editPh.value = city.ph
  editCa.value = city.caMgL
  editMg.value = city.mgMgL
  showAdvanced.value = true
  citySearch.value = ''
  isSearchingCity.value = false
}

function openCitySearch() {
  citySearch.value = ''
  isSearchingCity.value = true
  nextTick(() => citySearchInput.value?.focus())
}

function closeCitySearch() {
  isSearchingCity.value = false
  citySearch.value = ''
}

function clearSelectedCity() {
  editCity.value = ''
  editLevel.value = null
  editMgL.value = undefined
  editPh.value = undefined
  editCa.value = undefined
  editMg.value = undefined
  showAdvanced.value = false
  openCitySearch()
}

function selectPreset(level: WaterHardnessLevel) {
  editLevel.value = level
  editCity.value = ''
  editMgL.value = undefined
  editPh.value = undefined
  editCa.value = undefined
  editMg.value = undefined
  showAdvanced.value = false
}

function startEdit() {
  editLevel.value = waterStore.profile.level
  editCity.value = waterStore.profile.cityName ?? ''
  editMgL.value = waterStore.profile.hardnessMgL
  editPh.value = waterStore.profile.ph
  editCa.value = waterStore.profile.caMgL
  editMg.value = waterStore.profile.mgMgL
  showAdvanced.value = !!(
    waterStore.profile.hardnessMgL ||
    waterStore.profile.ph ||
    waterStore.profile.caMgL ||
    waterStore.profile.mgMgL
  )
  saveError.value = null
  editing.value = true
}

async function saveProfile() {
  if (!canSave.value || !editLevel.value) return
  savingProfile.value = true
  saveError.value = null
  try {
    await waterStore.save({
      level: editLevel.value,
      cityName: editCity.value.trim() || undefined,
      hardnessMgL: editMgL.value || undefined,
      ph: editPh.value || undefined,
      caMgL: editCa.value || undefined,
      mgMgL: editMg.value || undefined,
    })
    editing.value = false
  } catch {
    saveError.value = t('water_guide.save_error')
  } finally {
    savingProfile.value = false
  }
}

function cancelEdit() {
  saveError.value = null
  editing.value = false
}

// ── Advanced section JS transition hooks ──────────────────────────────────────

function onAdvancedBeforeEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = '0'
  e.style.overflow = 'hidden'
}

function onAdvancedEnter(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.transition = 'height 0.25s ease'
  e.style.height = e.scrollHeight + 'px'
  e.addEventListener('transitionend', done, { once: true })
}

function onAdvancedAfterEnter(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
  e.style.transition = ''
}

function onAdvancedBeforeLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = e.scrollHeight + 'px'
  e.style.overflow = 'hidden'
}

function onAdvancedLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.transition = 'height 0.25s ease'
  e.style.height = '0'
  e.addEventListener('transitionend', done, { once: true })
}

function onAdvancedAfterLeave(el: Element) {
  const e = el as HTMLElement
  e.style.height = ''
  e.style.overflow = ''
  e.style.transition = ''
}
</script>
