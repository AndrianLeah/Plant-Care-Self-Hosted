import { watch } from 'vue'
import { useRoute } from 'vue-router'

const themes: Record<string, { base: string; a: string; b: string }> = {
  // Plants: emerald light top-left, lime accent bottom-right
  plants: {
    base: '#f2faf4',
    a: 'rgba(16, 185, 129, 0.50)',
    b: 'rgba(134, 239, 172, 0.40)',
  },
  // Catalog: teal top-left, cyan bottom-right
  catalog: {
    base: '#f0f9f8',
    a: 'rgba(20, 184, 166, 0.50)',
    b: 'rgba(6, 182, 212, 0.38)',
  },
  // Water: indigo top-left, violet bottom-right
  water: {
    base: '#f4f5ff',
    a: 'rgba(99, 102, 241, 0.48)',
    b: 'rgba(139, 92, 246, 0.36)',
  },
  // Settings: rose top-left, mauve bottom-right
  settings: {
    base: '#fdf4fb',
    a: 'rgba(236, 72, 153, 0.38)',
    b: 'rgba(192, 132, 252, 0.32)',
  },
}

function resolveTheme(path: string) {
  if (path.startsWith('/catalog')) return themes.catalog
  if (path.startsWith('/water')) return themes.water
  if (path.startsWith('/settings')) return themes.settings
  return themes.plants
}

function applyTheme(path: string) {
  const t = resolveTheme(path)
  const el = document.getElementById('app')!
  el.style.setProperty('--bg-base', t.base)
  el.style.setProperty('--grad-a', t.a)
  el.style.setProperty('--grad-b', t.b)
}

export function useAppTheme() {
  const route = useRoute()
  watch(() => route.path, applyTheme, { immediate: true })
}
