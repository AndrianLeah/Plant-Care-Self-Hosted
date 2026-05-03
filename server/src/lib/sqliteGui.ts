import path from 'node:path'
import * as sqlite3 from 'sqlite3'
import { SqliteGuiNode } from 'sqlite-gui-node'

const defaultPort = 3011
const configuredPort = Number.parseInt(process.env.SQLITE_GUI_PORT ?? '', 10)
export const SQLITE_GUI_PORT =
  Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : defaultPort

let startPromise: Promise<void> | null = null

export function startSqliteGui(): Promise<void> {
  if (startPromise) return startPromise

  startPromise = (async () => {
    const rawDbPath = process.env.DB_PATH ?? 'plant-care.db'
    const dbPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(process.cwd(), rawDbPath)
    const driver = sqlite3.verbose()
    const guiDb = new driver.Database(dbPath)

    await SqliteGuiNode(guiDb, SQLITE_GUI_PORT)
    console.log(`✓ SQLite GUI initialized on http://127.0.0.1:${SQLITE_GUI_PORT}/home`)
  })().catch((error) => {
    startPromise = null
    throw error
  })

  return startPromise
}
