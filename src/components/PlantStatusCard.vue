<template>
  <div class="card-glass rounded-2xl">
    <div class="px-4 pt-4 pb-1 flex items-center gap-2">
      <div class="w-6 h-6 rounded-lg bg-leaf-100 flex items-center justify-center">
        <i class="mdi mdi-chart-box-outline text-leaf-600 text-sm" />
      </div>
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {{ t('detail.current_status') }}
      </span>
    </div>

    <div>
      <div class="flex items-center justify-between px-4 py-3">
        <span class="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <i class="mdi mdi-water-outline text-sky-400 text-base" />
          {{ t('detail.soil_moisture') }}
        </span>
        <MoistureBadge v-if="lastMoisture" :level="lastMoisture.level" />
        <span v-else class="text-xs text-slate-500 italic">{{ t('detail.not_logged') }}</span>
      </div>

      <div class="flex items-center justify-between px-4 py-3">
        <span class="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <i class="mdi mdi-calendar-check-outline text-emerald-500 text-base" />
          {{ t('detail.last_watered') }}
        </span>
        <span class="text-sm font-semibold text-slate-900">
          {{ lastWateredDate ? formatDate(lastWateredDate) : '—' }}
        </span>
      </div>

      <div class="flex items-center justify-between px-4 py-3">
        <span class="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <i class="mdi mdi-calendar-clock-outline text-violet-400 text-base" />
          {{ t('detail.next_watering') }}
        </span>
        <span
          :class="[
            'text-sm font-semibold',
            nextWatering
              ? dayjs(nextWatering).valueOf() <= Date.now()
                ? 'text-orange-500'
                : 'text-slate-900'
              : 'text-slate-500 italic text-xs',
          ]"
        >
          {{ nextWatering ? formatDate(nextWatering) : t('detail.not_enough_data') }}
        </span>
      </div>

      <div class="flex items-center justify-between px-4 py-3">
        <span class="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <i class="mdi mdi-map-marker-outline text-rose-400 text-base" />
          {{ t('detail.location') }}
        </span>
        <span class="text-sm font-semibold text-slate-900">{{ location || '—' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import type { MoistureLog } from '../types'
import MoistureBadge from './MoistureBadge.vue'

defineProps<{
  lastMoisture: MoistureLog | undefined
  lastWateredDate: string | undefined
  nextWatering: string | null
  location: string
}>()

const { t } = useI18n()

function formatDate(iso: string) {
  return dayjs(iso).format('D MMM YY')
}
</script>
