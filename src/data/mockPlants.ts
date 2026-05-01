import type { Plant } from '../types'

const now = Date.now()
const d = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString()

export const MOCK_PLANTS: Plant[] = [
  {
    id: 'mock-1',
    speciesId: 'monstera-deliciosa',
    nickname: 'Monstera',
    location: 'Soggiorno',
    addedDate: d(120),
    lastWateredDate: d(3),
    moistureLogs: [
      { id: 'ml-1-1', date: d(3), level: 'moist', note: 'Bagnata bene dopo 8 giorni' },
      { id: 'ml-1-2', date: d(7), level: 'slightly-dry' },
      { id: 'ml-1-3', date: d(11), level: 'moist' },
      { id: 'ml-1-4', date: d(14), level: 'slightly-dry' },
      { id: 'ml-1-5', date: d(18), level: 'dry', note: 'Terra molto secca' },
      { id: 'ml-1-6', date: d(21), level: 'moist' },
      { id: 'ml-1-7', date: d(25), level: 'slightly-dry' },
      { id: 'ml-1-8', date: d(29), level: 'moist' },
      { id: 'ml-1-9', date: d(33), level: 'moist' },
      { id: 'ml-1-10', date: d(39), level: 'dry' },
      { id: 'ml-1-11', date: d(43), level: 'moist' },
      { id: 'ml-1-12', date: d(50), level: 'slightly-dry' },
      { id: 'ml-1-13', date: d(57), level: 'moist' },
      { id: 'ml-1-14', date: d(64), level: 'dry', note: 'In vacanza' },
      { id: 'ml-1-15', date: d(71), level: 'moist' },
      { id: 'ml-1-16', date: d(78), level: 'slightly-dry' },
      { id: 'ml-1-17', date: d(85), level: 'moist' },
      { id: 'ml-1-18', date: d(92), level: 'moist' },
    ],
    wateringDates: [d(3), d(11), d(21), d(29), d(43), d(57), d(71), d(85)],
  },
  {
    id: 'mock-2',
    speciesId: 'calathea',
    nickname: 'Calatea',
    location: 'Camera da letto',
    addedDate: d(90),
    lastWateredDate: d(1),
    moistureLogs: [
      { id: 'ml-2-1', date: d(1), level: 'wet' },
      { id: 'ml-2-2', date: d(4), level: 'moist' },
      { id: 'ml-2-3', date: d(7), level: 'slightly-dry', note: 'Foglie leggermente arrotolate' },
      { id: 'ml-2-4', date: d(10), level: 'wet' },
      { id: 'ml-2-5', date: d(13), level: 'moist' },
      { id: 'ml-2-6', date: d(17), level: 'slightly-dry' },
      { id: 'ml-2-7', date: d(20), level: 'moist' },
      { id: 'ml-2-8', date: d(24), level: 'wet' },
      { id: 'ml-2-9', date: d(28), level: 'moist' },
      { id: 'ml-2-10', date: d(32), level: 'slightly-dry', note: 'Punte marroni' },
      { id: 'ml-2-11', date: d(36), level: 'moist' },
      { id: 'ml-2-12', date: d(42), level: 'wet' },
      { id: 'ml-2-13', date: d(48), level: 'moist' },
      { id: 'ml-2-14', date: d(55), level: 'slightly-dry' },
      { id: 'ml-2-15', date: d(62), level: 'moist' },
      { id: 'ml-2-16', date: d(70), level: 'dry', note: 'Partita per lavoro' },
      { id: 'ml-2-17', date: d(77), level: 'wet' },
      { id: 'ml-2-18', date: d(84), level: 'moist' },
    ],
    wateringDates: [
      d(1),
      d(7),
      d(10),
      d(17),
      d(24),
      d(32),
      d(36),
      d(42),
      d(48),
      d(55),
      d(62),
      d(77),
    ],
  },
  {
    id: 'mock-3',
    speciesId: 'snake-plant',
    nickname: 'Sansevieria',
    location: 'Ingresso',
    addedDate: d(200),
    lastWateredDate: d(14),
    moistureLogs: [
      { id: 'ml-3-1', date: d(14), level: 'moist' },
      { id: 'ml-3-2', date: d(21), level: 'slightly-dry' },
      { id: 'ml-3-3', date: d(35), level: 'dry' },
      { id: 'ml-3-4', date: d(42), level: 'moist' },
      { id: 'ml-3-5', date: d(56), level: 'dry' },
      { id: 'ml-3-6', date: d(63), level: 'slightly-dry' },
      { id: 'ml-3-7', date: d(77), level: 'moist' },
      { id: 'ml-3-8', date: d(91), level: 'dry' },
    ],
    wateringDates: [d(14), d(42), d(77)],
  },
  {
    id: 'mock-4',
    speciesId: 'fiddle-leaf-fig',
    nickname: 'Fico Lyrata',
    location: 'Studio',
    addedDate: d(120),
    lastWateredDate: d(7),
    moistureLogs: [
      { id: 'ml-4-1', date: d(7), level: 'slightly-dry' },
      { id: 'ml-4-2', date: d(11), level: 'moist' },
      { id: 'ml-4-3', date: d(16), level: 'slightly-dry' },
      { id: 'ml-4-4', date: d(21), level: 'dry', note: 'Terra molto secca, foglie appassite' },
      { id: 'ml-4-5', date: d(25), level: 'moist' },
      { id: 'ml-4-6', date: d(32), level: 'slightly-dry' },
      { id: 'ml-4-7', date: d(39), level: 'moist' },
      { id: 'ml-4-8', date: d(46), level: 'dry' },
      { id: 'ml-4-9', date: d(53), level: 'moist' },
      { id: 'ml-4-10', date: d(60), level: 'slightly-dry' },
      { id: 'ml-4-11', date: d(67), level: 'dry' },
      { id: 'ml-4-12', date: d(74), level: 'moist' },
      { id: 'ml-4-13', date: d(81), level: 'slightly-dry' },
      { id: 'ml-4-14', date: d(90), level: 'moist' },
    ],
    wateringDates: [d(7), d(11), d(25), d(39), d(53), d(67), d(74)],
  },
  {
    id: 'mock-5',
    speciesId: 'pothos',
    nickname: 'Pothos',
    location: 'Cucina',
    addedDate: d(60),
    lastWateredDate: d(5),
    moistureLogs: [
      { id: 'ml-5-1', date: d(5), level: 'moist' },
      { id: 'ml-5-2', date: d(9), level: 'slightly-dry' },
      { id: 'ml-5-3', date: d(14), level: 'dry' },
      { id: 'ml-5-4', date: d(18), level: 'moist' },
      { id: 'ml-5-5', date: d(23), level: 'slightly-dry' },
      { id: 'ml-5-6', date: d(28), level: 'moist' },
      { id: 'ml-5-7', date: d(35), level: 'dry', note: 'Radici a vista' },
      { id: 'ml-5-8', date: d(40), level: 'moist' },
      { id: 'ml-5-9', date: d(47), level: 'slightly-dry' },
      { id: 'ml-5-10', date: d(54), level: 'moist' },
    ],
    wateringDates: [d(5), d(14), d(18), d(28), d(35), d(40), d(54)],
  },
]

const STORAGE_KEY = 'plant-care-plants'

export function seedMockDataIfEmpty(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: Plant[] = raw ? JSON.parse(raw) : []
    if (existing.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PLANTS))
    }
  } catch {
    // ignore
  }
}
