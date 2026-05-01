<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
    :style="{ backgroundColor: bgColor, color: textColor }"
  >
    <i :class="`mdi ${icon} text-sm`" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MoistureLevel } from '../types'

const props = defineProps<{ level: MoistureLevel }>()
const { t } = useI18n()

const iconMap: Record<MoistureLevel, string> = {
  dry: 'mdi-weather-sunny',
  'slightly-dry': 'mdi-weather-partly-cloudy',
  moist: 'mdi-check-circle-outline',
  wet: 'mdi-water',
  waterlogged: 'mdi-waves',
}
const bgMap: Record<MoistureLevel, string> = {
  dry: '#fef3c7',
  'slightly-dry': '#ffedd5',
  moist: '#dcfce7',
  wet: '#dbeafe',
  waterlogged: '#ede9fe',
}
const textMap: Record<MoistureLevel, string> = {
  dry: '#92400e',
  'slightly-dry': '#7c2d12',
  moist: '#065f46',
  wet: '#1e40af',
  waterlogged: '#5b21b6',
}

const icon = computed(() => iconMap[props.level])
const label = computed(() => t(`moisture.${props.level}`))
const bgColor = computed(() => bgMap[props.level])
const textColor = computed(() => textMap[props.level])
</script>
