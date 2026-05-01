import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

const sqlite = new Database(process.env.DB_PATH ?? 'plant-care.db')

// Performance & correctness pragmas
sqlite.exec('PRAGMA journal_mode = WAL;')
sqlite.exec('PRAGMA foreign_keys = ON;')
sqlite.exec('PRAGMA synchronous = NORMAL;')

export const db = drizzle(sqlite, { schema })
