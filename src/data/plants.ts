import { useCatalogStore } from '../stores/catalog'
import type { CatalogSpecies } from '../types'

export function getSpeciesById(id: string): CatalogSpecies | undefined {
  return useCatalogStore().getById(id)
}
