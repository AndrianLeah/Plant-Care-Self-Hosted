<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="model" class="fixed inset-0 z-[100] flex flex-col justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="model = false" />

        <!-- Sheet -->
        <div class="relative bg-white rounded-t-3xl pb-safe shadow-2xl flex flex-col">
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          <!-- Header -->
          <div class="px-5 pt-1 pb-4 flex-shrink-0">
            <h3 class="text-base font-bold text-slate-900">
              {{ t('watering_log.title', { name: plantName }) }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">{{ t('watering_log.subtitle') }}</p>
          </div>

          <!-- Date picker -->
          <div class="px-4 pb-5 flex-shrink-0">
            <label
              class="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2"
            >
              {{ t('watering_log.date_label') }}
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <i class="mdi mdi-calendar-outline text-sky-400 text-lg" />
              </span>
              <input
                v-model="selectedDate"
                type="date"
                :max="todayStr"
                class="w-full border-2 border-sky-200 bg-sky-50 rounded-xl pl-9 pr-3 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-sky-400 focus:ring-0 transition-colors"
              />
            </div>

            <!-- Quick date chips -->
            <div class="flex gap-2 mt-3 flex-wrap">
              <AppButton
                v-for="chip in quickDates"
                :key="chip.label"
                variant="custom"
                size="sm"
                :class="
                  selectedDate === chip.value
                    ? 'border-2 border-sky-500 bg-sky-500 text-white'
                    : 'border-2 border-slate-200 bg-white text-slate-500 hover:border-sky-300 hover:bg-sky-50'
                "
                @click="selectedDate = chip.value"
              >
                {{ chip.label }}
              </AppButton>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 px-4 pt-3 pb-5 flex-shrink-0 border-t border-slate-100">
            <AppButton variant="outline" color="sky" size="md" full-width @click="model = false">
              {{ t('watering_log.cancel') }}
            </AppButton>
            <AppButton variant="primary" color="sky" size="md" full-width @click="save">
              <i class="mdi mdi-watering-can-outline" />
              {{ t('watering_log.save') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'

const props = defineProps<{ modelValue: boolean; plantName: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', isoDate: string): void
}>()

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { t } = useI18n()

const todayStr = dayjs().format('YYYY-MM-DD')
const selectedDate = ref(todayStr)

// Reset to today every time the sheet opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) selectedDate.value = todayStr
  },
)

const quickDates = computed(() => {
  const labels = [
    { label: t('watering_log.today'), days: 0 },
    { label: t('watering_log.yesterday'), days: 1 },
    { label: t('watering_log.two_days_ago'), days: 2 },
    { label: t('watering_log.three_days_ago'), days: 3 },
  ]
  return labels.map(({ label, days }) => ({
    label,
    value: dayjs().subtract(days, 'day').format('YYYY-MM-DD'),
  }))
})

function save() {
  emit('save', dayjs(selectedDate.value).hour(12).minute(0).second(0).toISOString())
  model.value = false
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
