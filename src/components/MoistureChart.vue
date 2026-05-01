<template>
  <div>
    <!-- Period filter -->
    <div class="flex gap-1.5 mb-4">
      <AppButton
        v-for="p in periods"
        :key="p.value"
        variant="custom"
        size="sm"
        :class="[
          activePeriod === p.value
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
        ]"
        @click="activePeriod = p.value"
      >
        {{ p.label }}
      </AppButton>
    </div>

    <!-- Chart -->
    <div class="relative h-44">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Empty state -->
    <p v-if="filteredLogs.length === 0" class="text-center text-sm text-slate-500 py-6">
      {{ t('detail.no_data_period') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import dayjs from 'dayjs'
import { sortBy } from 'lodash'
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import { useI18n } from 'vue-i18n'
import type { MoistureLog } from '../types'
import AppButton from './AppButton.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{ logs: MoistureLog[] }>()
const { t } = useI18n()

const LEVEL_ORDER: Record<string, number> = {
  dry: 1,
  'slightly-dry': 2,
  moist: 3,
  wet: 4,
  waterlogged: 5,
}
const LEVEL_LABEL: Record<string, string> = {
  1: 'Dry',
  2: 'Sl. Dry',
  3: 'Moist',
  4: 'Wet',
  5: 'Waterlogged',
}

const periods = [
  { label: '1W', value: 7 },
  { label: '1M', value: 30 },
  { label: '3M', value: 90 },
  { label: 'All', value: 0 },
]
const activePeriod = ref(30)

const filteredLogs = computed(() => {
  const sorted = sortBy(props.logs, (l) => new Date(l.date).getTime())
  if (activePeriod.value === 0) return sorted
  const cutoff = Date.now() - activePeriod.value * 86400000
  return sorted.filter((l) => new Date(l.date).getTime() >= cutoff)
})

const LEVEL_COLOR: Record<number, string> = {
  1: '#f97316', // dry        : orange
  2: '#eab308', // sl. dry    : yellow
  3: '#16a34a', // moist      : emerald
  4: '#0ea5e9', // wet        : sky
  5: '#6366f1', // waterlogged: indigo
}

const chartData = computed(() => ({
  labels: filteredLogs.value.map((l) => dayjs(l.date).format('D MMM')),
  datasets: [
    {
      data: filteredLogs.value.map((l) => LEVEL_ORDER[l.level] ?? 0),
      borderColor: '#94a3b8',
      backgroundColor: 'rgba(148,163,184,0.08)',
      borderWidth: 2,
      pointBackgroundColor: filteredLogs.value.map(
        (l) => LEVEL_COLOR[LEVEL_ORDER[l.level]] ?? '#94a3b8',
      ),
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 7,
      pointHoverRadius: 9,
      tension: 0.4,
      fill: true,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${LEVEL_LABEL[ctx.raw] ?? ctx.raw}`,
      },
    },
  },
  scales: {
    y: {
      min: 0.5,
      max: 5.5,
      ticks: {
        stepSize: 1,
        callback: (val: any) => LEVEL_LABEL[val] ?? '',
        font: { size: 10 },
        color: '#94a3b8',
      },
      grid: { color: 'rgba(0,0,0,0.04)' },
      border: { display: false },
    },
    x: {
      ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 0 },
      grid: { display: false },
      border: { display: false },
    },
  },
}))
</script>
