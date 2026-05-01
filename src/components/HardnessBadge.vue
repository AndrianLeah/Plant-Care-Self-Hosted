<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
    :style="{ backgroundColor: bgColor, color: textColor }"
    :title="tooltip"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { WaterHardnessTolerance } from '../types'

const props = defineProps<{ tolerance: WaterHardnessTolerance }>()
const { t } = useI18n()

const bgMap: Record<WaterHardnessTolerance, string> = {
  'soft-only': '#fee2e2',
  'soft-preferred': '#fef3c7',
  tolerant: '#ffedd5',
  any: '#dcfce7',
}
const textMap: Record<WaterHardnessTolerance, string> = {
  'soft-only': '#991b1b',
  'soft-preferred': '#92400e',
  tolerant: '#7c2d12',
  any: '#065f46',
}
const tooltipKeyMap: Record<WaterHardnessTolerance, string> = {
  'soft-only': 'hardness.tooltip_soft_only',
  'soft-preferred': 'hardness.tooltip_soft_preferred',
  tolerant: 'hardness.tooltip_tolerant',
  any: 'hardness.tooltip_any',
}

const label = computed(() => t(`hardness.${props.tolerance}`))
const tooltip = computed(() => t(tooltipKeyMap[props.tolerance]))
const bgColor = computed(() => bgMap[props.tolerance])
const textColor = computed(() => textMap[props.tolerance])
</script>
