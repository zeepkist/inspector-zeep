import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { User } from 'discord.js'

import { checkLevelIsValid } from './checkLevelIsValid.js'
import { HASH_FOLDER, ZEEPKIST_THEME_NAME } from './config/constants.js'
import { getLevel } from './getLevel.js'
import { debug, info } from './log.js'
import { CachedLevel, LevelValidity } from './types.js'

interface Hash {
  workshopPath: string
  hash: string
  level: CachedLevel
  isValid: boolean
  validity?: LevelValidity
  invalidatedAt?: number
}

interface CreateLevelHash {
  hasChanged: boolean
  isNew: boolean
  previousLevel?: CachedLevel
}

const HASH_FILE = join(
  HASH_FOLDER,
  `${ZEEPKIST_THEME_NAME?.replaceAll(' ', '-').toLowerCase()}.json`
)

const hashes: Hash[] = await readFile(join(HASH_FILE), 'utf8')
  .then(JSON.parse)
  .catch(() => [] as Hash[])

debug(`Loaded ${hashes.length} hashes`, import.meta, true)

const hashLevel = (level: string) => {
  const hash = createHash('sha256')

  hash.update(level)

  return hash.digest('hex')
}

export const createLevelHash = async (
  workshopPath: string,
  author: User
): Promise<CreateLevelHash> => {
  const level = await getLevel(workshopPath)
  const levelValidity = await checkLevelIsValid(workshopPath, author)

  if (!level || !levelValidity) {
    info(`Level ${workshopPath} does not exist`, import.meta)

    return {
      hasChanged: false,
      isNew: true
    }
  }

  const fileName = basename(level.path, extname(level.path))
  const currentHash = hashLevel(level.level)

  const previousLevel = hashes.find(hash => hash.workshopPath === workshopPath)
  const hasChanged = previousLevel
    ? previousLevel && currentHash !== previousLevel.hash
    : true

  const isLevelInvalid =
    !levelValidity.isValid ||
    !levelValidity.validity.isStartFinishProximityValid

  if (hasChanged) {
    info(`"${fileName}" has changed or is new`, import.meta)

    if (previousLevel) {
      const newLevel: Hash = {
        workshopPath,
        hash: currentHash,
        level: {
          name: level.name,
          path: level.path,
          blocks: level.blocks.length,
          author: level.author,
          uuid: level.uuid,
          time: level.time,
          checkpoints: level.checkpoints,
          changerGateModes: level.changerGateModes,
          logicBlocks: level.logicBlocks
        },
        isValid: levelValidity.isValid,
        validity: levelValidity.validity,
        invalidatedAt: 0
      }

      if (isLevelInvalid) {
        newLevel.invalidatedAt = Date.now()
      }

      hashes.splice(hashes.indexOf(previousLevel), 1, newLevel)
    } else {
      const existingLevel: Hash = {
        workshopPath,
        hash: currentHash,
        level: {
          name: level.name,
          path: level.path,
          blocks: level.blocks.length,
          author: level.author,
          uuid: level.uuid,
          time: level.time,
          checkpoints: level.checkpoints,
          changerGateModes: level.changerGateModes,
          logicBlocks: level.logicBlocks
        },
        isValid: levelValidity.isValid,
        validity: levelValidity.validity
      }

      if (isLevelInvalid) {
        existingLevel.invalidatedAt = Date.now()
      }

      hashes.push(existingLevel)
    }
  } else if (previousLevel) {
    // Force-update existing invalid levels to contain validity information
    if (
      (!levelValidity.isValid ||
        !levelValidity.validity.isStartFinishProximityValid) &&
      !previousLevel.validity
    ) {
      const existingLevel = {
        ...previousLevel,
        isValid: levelValidity.isValid,
        validity: levelValidity.validity
      }

      if (isLevelInvalid) {
        existingLevel.invalidatedAt = Date.now()
      }

      hashes.splice(hashes.indexOf(previousLevel), 1, existingLevel)
    }

    debug(`Level ${fileName} has not changed`, import.meta, true)
  }

  return {
    hasChanged: !!hasChanged,
    isNew: !previousLevel,
    previousLevel: previousLevel?.level
  }
}

export const getLevelHash = (workshopId: string) => {
  return hashes.find(hash => hash.workshopPath.split('/').at(-1) === workshopId)
}

export const saveLevelHashes = async () => {
  await writeFile(join(HASH_FILE), JSON.stringify(hashes, undefined, 2))

  debug(`Saved ${hashes.length} hashes`, import.meta, true)
}
