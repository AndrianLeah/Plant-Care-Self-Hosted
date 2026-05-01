import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { getI18n } from '../i18n'
import { api } from '../lib/api'
import type { CatalogSpecies } from '../types'

const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'

export const useCatalogStore = defineStore('catalog', () => {
  const i18n = getI18n()
  const locale = i18n.global.locale

  const species = ref<CatalogSpecies[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const imageCache = reactive<Record<string, string>>({})
  const imageFetching = new Set<string>()

  // ── Fetch ───────────────────────────────────────────────────────────────────

  function prefetchImage(speciesId: string): void {
    if (imageCache[speciesId] || imageFetching.has(speciesId)) return
    imageFetching.add(speciesId)
    fetch(`${BASE}/catalog/${speciesId}/image`)
      .then(async (res) => {
        if (res.ok) imageCache[speciesId] = URL.createObjectURL(await res.blob())
      })
      .catch(() => {})
      .finally(() => imageFetching.delete(speciesId))
  }

  async function fetchCatalog(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      species.value = await api.get<CatalogSpecies[]>(`/catalog?lang=${locale.value}`)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load catalog'
    } finally {
      loading.value = false
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function getById(id: string): CatalogSpecies | undefined {
    return species.value.find((s) => s.id === id)
  }

  function getImageUrl(speciesId: string): string {
    prefetchImage(speciesId)
    return imageCache[speciesId] ?? `${BASE}/catalog/${speciesId}/image`
  }

  const speciesCount = computed(() => species.value.length)

  // Re-fetch translations automatically when the UI language changes (images stay cached)
  watch(locale, fetchCatalog)

  return { species, loading, error, speciesCount, fetchCatalog, getById, getImageUrl }
})
