<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'solid' | 'glass' | 'outline' | 'primary' | 'ghost' | 'custom'
type Color = 'emerald' | 'sky' | 'violet' | 'teal' | 'pink' | 'cyan' | 'slate' | 'leaf' | 'red'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    color?: Color
    size?: Size
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    fullWidth?: boolean
  }>(),
  {
    variant: 'solid',
    color: 'slate',
    size: 'md',
    type: 'button',
    disabled: false,
    fullWidth: false,
  },
)

// All class strings must be complete (no interpolation) so Tailwind includes them in the build
const solidMap: Record<Color, string> = {
  emerald: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800',
  sky: 'bg-sky-100     hover:bg-sky-200     text-sky-800',
  violet: 'bg-violet-100  hover:bg-violet-200  text-violet-800',
  teal: 'bg-teal-100    hover:bg-teal-200    text-teal-800',
  pink: 'bg-pink-100    hover:bg-pink-200    text-pink-800',
  cyan: 'bg-cyan-100    hover:bg-cyan-200    text-cyan-800',
  slate: 'bg-slate-100   hover:bg-slate-200   text-slate-700',
  leaf: 'bg-leaf-100    hover:bg-leaf-200    text-leaf-800',
  red: 'bg-red-100     hover:bg-red-200     text-red-800',
}

const glassMap: Record<Color, string> = {
  emerald:
    'bg-white/70 hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-400 text-emerald-700 shadow-sm backdrop-blur-sm',
  sky: 'bg-white/70 hover:bg-sky-50     border border-sky-300     hover:border-sky-400     text-sky-700     shadow-sm backdrop-blur-sm',
  violet:
    'bg-white/70 hover:bg-violet-50  border border-violet-300  hover:border-violet-400  text-violet-700  shadow-sm backdrop-blur-sm',
  teal: 'bg-white/70 hover:bg-teal-50    border border-teal-300    hover:border-teal-400    text-teal-700    shadow-sm backdrop-blur-sm',
  pink: 'bg-white/70 hover:bg-pink-50    border border-pink-300    hover:border-pink-400    text-pink-700    shadow-sm backdrop-blur-sm',
  cyan: 'bg-white/70 hover:bg-cyan-50    border border-cyan-300    hover:border-cyan-400    text-cyan-700    shadow-sm backdrop-blur-sm',
  slate:
    'bg-white/70 hover:bg-slate-50   border border-slate-300   hover:border-slate-400   text-slate-700   shadow-sm backdrop-blur-sm',
  leaf: 'bg-white/70 hover:bg-leaf-50    border border-leaf-300    hover:border-leaf-400    text-leaf-700    shadow-sm backdrop-blur-sm',
  red: 'bg-white/70 hover:bg-red-50     border border-red-300     hover:border-red-400     text-red-700     shadow-sm backdrop-blur-sm',
}

const outlineMap: Record<Color, string> = {
  emerald: 'border border-emerald-400 text-emerald-600 hover:bg-emerald-50',
  sky: 'border border-sky-400     text-sky-500     hover:bg-sky-50',
  violet: 'border border-violet-400  text-violet-600  hover:bg-violet-50',
  teal: 'border border-teal-400    text-teal-600    hover:bg-teal-50',
  pink: 'border border-pink-400    text-pink-600    hover:bg-pink-50',
  cyan: 'border border-cyan-400    text-cyan-600    hover:bg-cyan-50',
  slate: 'border border-slate-300   text-slate-600   hover:bg-slate-50',
  leaf: 'border border-leaf-600    text-leaf-600    hover:bg-leaf-50',
  red: 'border border-red-400     text-red-600     hover:bg-red-50',
}

const primaryMap: Record<Color, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  sky: 'bg-sky-500     hover:bg-sky-600     text-white shadow-sm',
  violet: 'bg-violet-600  hover:bg-violet-700  text-white shadow-sm',
  teal: 'bg-teal-500    hover:bg-teal-600    text-white shadow-sm',
  pink: 'bg-pink-500    hover:bg-pink-600    text-white shadow-sm',
  cyan: 'bg-cyan-500    hover:bg-cyan-600    text-white shadow-sm',
  slate: 'bg-slate-600   hover:bg-slate-700   text-white shadow-sm',
  leaf: 'bg-leaf-600    hover:bg-leaf-700    text-white shadow-sm',
  red: 'bg-red-500     hover:bg-red-600     text-white shadow-sm',
}

const ghostMap: Record<Color, string> = {
  emerald: 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50',
  sky: 'text-sky-500     hover:text-sky-700     hover:bg-sky-50',
  violet: 'text-violet-500  hover:text-violet-700  hover:bg-violet-50',
  teal: 'text-teal-500    hover:text-teal-700    hover:bg-teal-50',
  pink: 'text-pink-500    hover:text-pink-700    hover:bg-pink-50',
  cyan: 'text-cyan-500    hover:text-cyan-700    hover:bg-cyan-50',
  slate: 'text-slate-500   hover:text-slate-700   hover:bg-slate-100',
  leaf: 'text-leaf-500    hover:text-leaf-700    hover:bg-leaf-50',
  red: 'text-red-400    hover:text-red-600     hover:bg-red-50',
}

const sizeMap: Record<Size, string> = {
  sm: 'px-3.5 py-2    text-xs  font-semibold gap-1.5',
  md: 'px-4   py-2.5  text-sm  font-semibold gap-1.5',
  lg: 'px-5   py-3.5  text-sm  font-bold     gap-2',
  icon: 'w-10   h-10    text-lg',
}

const colorClasses = computed(() => {
  if (props.variant === 'custom') return ''
  const map = {
    solid: solidMap,
    glass: glassMap,
    outline: outlineMap,
    primary: primaryMap,
    ghost: ghostMap,
  }
  return map[props.variant][props.color]
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center rounded-full transition-all active:scale-[0.97]"
    :class="[
      colorClasses,
      sizeMap[size],
      fullWidth && 'w-full',
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    ]"
  >
    <slot />
  </button>
</template>
