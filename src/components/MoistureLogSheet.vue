<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="model" class="fixed inset-0 z-[100] flex flex-col justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="model = false" />

        <!-- Sheet -->
        <div class="relative bg-white rounded-t-3xl pb-safe shadow-2xl max-h-[90dvh] flex flex-col">
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          <!-- Header -->
          <div class="px-5 pt-1 pb-3 flex-shrink-0">
            <h3 class="text-base font-bold text-slate-900">
              {{ t('moisture_log.title', { name: plantName }) }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">{{ t('moisture_log.subtitle') }}</p>
          </div>

          <!-- Scrollable content -->
          <div class="px-4 overflow-y-auto flex-1">
            <!-- Options -->
            <button
              v-for="opt in options"
              :key="opt.level"
              class="w-full flex items-center gap-3 p-3 rounded-2xl mb-2 border-2 transition-all text-left"
              :class="selected === opt.level ? opt.activeClass : opt.idleClass"
              @click="selected = opt.level"
            >
              <span
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                :class="opt.iconBg"
              >
                <i :class="`mdi ${opt.icon}`" :style="{ color: opt.iconColor }" />
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-slate-900">{{ opt.label }}</div>
                <div class="text-xs text-slate-500 mt-0.5">
                  {{ t(`moisture_log.hints.${opt.level}`) }}
                </div>
                <div
                  v-if="props.idealMoisture"
                  class="text-xs font-medium mt-0.5"
                  :class="isWaterHint(opt.level) ? 'text-emerald-600' : 'text-slate-400'"
                >
                  {{ hintFor(opt.level) }}
                </div>
              </div>
              <i
                v-if="selected === opt.level"
                class="mdi mdi-check-circle text-xl flex-shrink-0"
                :style="{ color: opt.iconColor }"
              />
            </button>

            <!-- Note input -->
            <input
              v-model="note"
              type="text"
              :placeholder="t('moisture_log.note_placeholder')"
              class="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-leaf-600 focus:ring-1 focus:ring-leaf-600 bg-white placeholder-slate-400 mt-1 mb-3"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3 px-4 pt-3 pb-5 flex-shrink-0 border-t border-slate-100">
            <AppButton variant="outline" color="leaf" size="md" full-width @click="model = false">
              {{ t('moisture_log.cancel') }}
            </AppButton>
            <AppButton
              variant="primary"
              color="leaf"
              size="md"
              full-width
              :disabled="!selected"
              @click="save"
            >
              {{ t('moisture_log.save') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MoistureLevel } from '../types'
import AppButton from './AppButton.vue'

const LEVELS: MoistureLevel[] = ['dry', 'slightly-dry', 'moist', 'wet', 'waterlogged']

const props = defineProps<{
  modelValue: boolean
  plantName: string
  idealMoisture?: MoistureLevel
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', level: MoistureLevel, note?: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { t } = useI18n()
const selected = ref<MoistureLevel | null>(null)
const note = ref('')

function hintFor(level: MoistureLevel): string {
  const ideal = props.idealMoisture
  if (!ideal) return t(`moisture_log.hints.${level}`)
  const idx = LEVELS.indexOf(level)
  const idealIdx = LEVELS.indexOf(ideal)
  if (level === 'waterlogged') return t('moisture_log.hint_waterlogged')
  if (idx < idealIdx - 1) return t('moisture_log.hint_too_dry')
  if (idx === idealIdx - 1) return t('moisture_log.hint_slightly_below')
  if (idx === idealIdx) return t('moisture_log.hint_ideal')
  if (idx === idealIdx + 1) return t('moisture_log.hint_slightly_above')
  return t('moisture_log.hint_too_wet')
}

function isWaterHint(level: MoistureLevel): boolean {
  const ideal = props.idealMoisture
  if (!ideal) return false
  const idx = LEVELS.indexOf(level)
  const idealIdx = LEVELS.indexOf(ideal)
  return idx <= idealIdx && level !== 'waterlogged'
}

const options = computed<
  {
    level: MoistureLevel
    label: string
    icon: string
    iconColor: string
    iconBg: string
    idleClass: string
    activeClass: string
  }[]
>(() => [
  {
    level: 'dry',
    icon: 'mdi-weather-sunny',
    label: t('moisture.dry'),
    iconColor: '#f97316',
    iconBg: 'bg-orange-50',
    idleClass: 'bg-white border-slate-100 hover:border-orange-200 hover:bg-orange-50/40',
    activeClass: 'bg-orange-50 border-orange-400',
  },
  {
    level: 'slightly-dry',
    icon: 'mdi-weather-partly-cloudy',
    label: t('moisture.slightly-dry'),
    iconColor: '#eab308',
    iconBg: 'bg-yellow-50',
    idleClass: 'bg-white border-slate-100 hover:border-yellow-200 hover:bg-yellow-50/40',
    activeClass: 'bg-yellow-50 border-yellow-400',
  },
  {
    level: 'moist',
    icon: 'mdi-check-circle-outline',
    label: t('moisture.moist'),
    iconColor: '#16a34a',
    iconBg: 'bg-emerald-50',
    idleClass: 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40',
    activeClass: 'bg-emerald-50 border-emerald-400',
  },
  {
    level: 'wet',
    icon: 'mdi-water',
    label: t('moisture.wet'),
    iconColor: '#0ea5e9',
    iconBg: 'bg-sky-50',
    idleClass: 'bg-white border-slate-100 hover:border-sky-200 hover:bg-sky-50/40',
    activeClass: 'bg-sky-50 border-sky-400',
  },
  {
    level: 'waterlogged',
    icon: 'mdi-waves',
    label: t('moisture.waterlogged'),
    iconColor: '#6366f1',
    iconBg: 'bg-indigo-50',
    idleClass: 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40',
    activeClass: 'bg-indigo-50 border-indigo-400',
  },
])

function save() {
  if (!selected.value) return
  emit('save', selected.value, note.value.trim() || undefined)
  model.value = false
  selected.value = null
  note.value = ''
}
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .relative,
.sheet-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .relative,
.sheet-leave-to .relative {
  transform: translateY(100%);
}
</style>
