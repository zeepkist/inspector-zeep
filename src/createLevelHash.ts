import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { HASH_FOLDER, ZEEPKIST_THEME_NAME } from './config/constants.js'
import { getLevel } from './getLevel.js'
import { debug, info } from './log.js'
import { CachedLevel } from './types.js'

interface Hash {
  workshopPath: string
  hash: string
  level: CachedLevel
}

const HASH_FILE = join(
  HASH_FOLDER,
  `${ZEEPKIST_THEME_NAME?.replaceAll(' ', '-').toLowerCase()}.json`
)

const hashes: Hash[] = await readFile(join(HASH_FILE), 'utf8')
  .then(JSON.parse)
  .catch(() => [])

debug(`Loaded ${hashes.length} hashes`, import.meta, true)

const hashLevel = (level: string) => {
  const hash = createHash('sha256')

  hash.update(level)

  return hash.digest('hex')
}

const levelHash = async (workshopPath: string) => {
  const level = await getLevel(workshopPath)

  if (!level)
    return {
      currentHash: '',
      previousHash: {} as Hash
    }

  const fileName = basename(level.path, extname(level.path))
  const currentHash = hashLevel(level.level)

  const previousHash = hashes.find(hash => hash.workshopPath === workshopPath)

  if (previousHash && currentHash === previousHash.hash) {
    debug(`Level ${fileName} has not changed`, import.meta, true)
  } else {
    info(`Level ${fileName} has changed or is new`, import.meta)

    if (previousHash) {
      previousHash.hash = currentHash
    } else {
      hashes.push({
        workshopPath,
        hash: currentHash,
        level: {
          name: level.name,
          path: level.path,
          blocks: level.blocks.length,
          author: level.author,
          uuid: level.uuid,
          time: level.time,
          checkpoints: level.checkpoints
        }
      })
    }
  }

  return {
    currentHash,
    previousHash
  }
}

export const createLevelHash = async (workshopPath: string) => {
  const { currentHash, previousHash } = await levelHash(workshopPath)

  const isNew = !previousHash

  return {
    hasChanged: currentHash !== previousHash?.hash,
    isNew,
    previousLevel: previousHash?.level
  }
}

export const saveLevelHashes = async () => {
  await writeFile(join(HASH_FILE), JSON.stringify(hashes, undefined, 2))

  debug(`Saved ${hashes.length} hashes`, import.meta, true)
}
