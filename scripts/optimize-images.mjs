import sharp from 'sharp'
import { readdirSync, statSync, mkdirSync } from 'fs'
import { join } from 'path'
import { rename } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const originalsDir = join(__dirname, '../server/data/originals')
const compressedDir = join(__dirname, '../server/data/compressed')
mkdirSync(compressedDir, { recursive: true })

const files = readdirSync(originalsDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))

for (const file of files) {
  const src = join(originalsDir, file)
  const dest = join(compressedDir, file.replace(/\.(jpe?g|png|webp)$/i, '.webp'))
  const tmp = dest + '.tmp'
  const before = statSync(src).size

  await sharp(src)
    .resize(900, 675, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(tmp)

  await rename(tmp, dest)

  const after = statSync(dest).size
  const pct = (((before - after) / before) * 100).toFixed(1)
  console.log(`${file}: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB  (-${pct}%)`)
}
