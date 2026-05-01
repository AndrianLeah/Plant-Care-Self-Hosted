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
            ? 'bg-sky-500 text-white'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
        ]"
        @click="activePeriod = p.value"
      >
        {{ p.label }}
      </AppButton>
    </div>

    <!-- Chart -->
    <div class="relative h-44">
      <Bar :data="chartData" :options="chartOptions" />
    </div>

    <p v-if="buckets.length === 0 || total === 0" class="text-center text-sm text-slate-500 py-6">
      {{ t('detail.no_data_period') }}
    </p>

    <!-- Summary -->
    <div v-else class="flex items-center justify-between mt-3 px-1 text-xs text-slate-500">
      <span>{{ t('detail.watering_total', { n: total }) }}</span>
      <span>{{ t('detail.watering_avg', { n: avgDays }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js'
import dayjs from 'dayjs'
import { mean, sortBy } from 'lodash'
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{ dates: string[] }>()
const { t } = useI18n()

const periods = [
  { label: '1W', value: 7 },
  { label: '1M', value: 30 },
  { label: '3M', value: 90 },
  { label: 'All', value: 0 },
]
const activePeriod = ref(30)

const filtered = computed(() => {
  if (!props.dates?.length) return []
  const cutoff = activePeriod.value === 0 ? 0 : Date.now() - activePeriod.value * 86400000
  return sortBy(props.dates.map((d) => new Date(d).getTime()).filter((t) => t >= cutoff))
})

const total = computed(() => filtered.value.length)

const avgDays = computed(() => {
  if (filtered.value.length < 2) return '—'
  const spans = filtered.value.slice(1).map((t, i) => (t - filtered.value[i]) / 86400000)
  return Math.round(mean(spans))
})

/** Group waterings into weekly buckets */
const buckets = computed(() => {
  if (!filtered.value.length) return []
  const start = filtered.value[0]
  const end = Date.now()
  const result: { label: string; count: number }[] = []
  let cursor = start
  while (cursor <= end) {
    const weekEnd = cursor + 7 * 86400000
    const count = filtered.value.filter((t) => t >= cursor && t < weekEnd).length
    const label = dayjs(cursor).format('D MMM')
    result.push({ label, count })
    cursor = weekEnd
  }
  return result
})

const chartData = computed(() => ({
  labels: buckets.value.map((b) => b.label),
  datasets: [
    {
      data: buckets.value.map((b) => b.count),
      backgroundColor: 'rgba(14,165,233,0.75)',
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.raw}× annaffiata`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
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
