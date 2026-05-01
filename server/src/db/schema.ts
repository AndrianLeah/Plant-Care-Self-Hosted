import { blob, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // crypto.randomUUID()
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  lang: text('lang').notNull().default('en'),
  waterProfile: text('water_profile'), // JSON string of UserWaterProfile
  createdAt: text('created_at').notNull(),
})

// ─── Refresh tokens ───────────────────────────────────────────────────────────

export const refreshTokens = sqliteTable('refresh_tokens', {
  jti: text('jti').primaryKey(), // JWT ID claim (UUID)
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(), // ISO string
  createdAt: text('created_at').notNull(),
})

// ─── Species catalog ──────────────────────────────────────────────────────────

export const species = sqliteTable('species', {
  id: text('id').primaryKey(), // e.g. 'monstera-deliciosa'
  scientificName: text('scientific_name').notNull(),
  difficulty: text('difficulty').$type<'easy' | 'medium' | 'hard'>().notNull(),
  idealMoisture: text('ideal_moisture')
    .$type<'dry' | 'slightly-dry' | 'moist' | 'wet' | 'waterlogged'>()
    .notNull(),
  light: text('light')
    .$type<'low' | 'indirect' | 'bright-indirect' | 'direct'>()
    .notNull(),
  waterHardnessTolerance: text('water_hardness_tolerance')
    .$type<'soft-only' | 'soft-preferred' | 'tolerant' | 'any'>()
    .notNull(),
  coldWaterSensitive: integer('cold_water_sensitive', { mode: 'boolean' }).notNull(),
  wateringFreqMin: integer('watering_freq_min').notNull(),
  wateringFreqMax: integer('watering_freq_max').notNull(),
  tempMin: integer('temp_min').notNull(),
  tempMax: integer('temp_max').notNull(),
  safeCats: integer('safe_cats', { mode: 'boolean' }).notNull(),
  safeDogs: integer('safe_dogs', { mode: 'boolean' }).notNull(),
  category: text('category').$type<'ornamental' | 'culinary'>().notNull(),
  subcategory: text('subcategory')
    .$type<'tropical' | 'succulent' | 'palm' | 'orchid' | 'herb' | 'tree'>()
    .notNull(),
})

// ─── Species translations ─────────────────────────────────────────────────────

export const speciesTranslations = sqliteTable(
  'species_translations',
  {
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(), // e.g. 'en', 'it'
    name: text('name').notNull(),
    description: text('description').notNull(),
    moistureNotes: text('moisture_notes').notNull(),
    lightNotes: text('light_notes').notNull(),
    waterTips: text('water_tips').notNull(),
    commonProblems: text('common_problems').notNull(), // JSON string: string[]
  },
  (t) => [primaryKey({ columns: [t.speciesId, t.lang] })],
)

// ─── Species images ───────────────────────────────────────────────────────────

export const speciesImages = sqliteTable('species_images', {
  speciesId: text('species_id')
    .primaryKey()
    .references(() => species.id, { onDelete: 'cascade' }),
  data: blob('data', { mode: 'buffer' }).notNull(),
  mimeType: text('mime_type').notNull().default('image/webp'),
  updatedAt: text('updated_at').notNull(),
})

// ─── Water presets ────────────────────────────────────────────────────────────

export const waterPresets = sqliteTable('water_presets', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  region: text('region').notNull(),
  level: text('level')
    .$type<'very-soft' | 'soft' | 'moderately-hard' | 'hard' | 'very-hard'>()
    .notNull(),
  hardnessMgL: real('hardness_mg_l').notNull(),
  ph: real('ph').notNull(),
  caMgL: real('ca_mg_l').notNull(),
  mgMgL: real('mg_mg_l').notNull(),
})

// ─── User plants ──────────────────────────────────────────────────────────────

export const plants = sqliteTable('plants', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  speciesId: text('species_id')
    .notNull()
    .references(() => species.id),
  nickname: text('nickname').notNull(),
  location: text('location').notNull(),
  addedDate: text('added_date').notNull(),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  lastWateredDate: text('last_watered_date'),
})

// ─── Plant photos ─────────────────────────────────────────────────────────────

export const plantPhotos = sqliteTable('plant_photos', {
  plantId: text('plant_id')
    .primaryKey()
    .references(() => plants.id, { onDelete: 'cascade' }),
  data: blob('data', { mode: 'buffer' }).notNull(),
  mimeType: text('mime_type').notNull().default('image/jpeg'),
  updatedAt: text('updated_at').notNull(),
})

// ─── Moisture logs ────────────────────────────────────────────────────────────

export const moistureLogs = sqliteTable('moisture_logs', {
  id: text('id').primaryKey(),
  plantId: text('plant_id')
    .notNull()
    .references(() => plants.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  level: text('level')
    .$type<'dry' | 'slightly-dry' | 'moist' | 'wet' | 'waterlogged'>()
    .notNull(),
  note: text('note'),
})

// ─── Watering dates ───────────────────────────────────────────────────────────

export const wateringDates = sqliteTable('watering_dates', {
  id: text('id').primaryKey(),
  plantId: text('plant_id')
    .notNull()
    .references(() => plants.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
})
