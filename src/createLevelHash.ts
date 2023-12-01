import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { getLevel } from './getLevel.js'
import { info } from './log.js'

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
      previousHash: ''
    }

  const fileName = basename(level.path, extname(level.path))
  const currentHash = hashLevel(level.level)

  const previousHash = await readFile(join('./hash', fileName), 'utf8').catch(
    () => ''
  )

  if (currentHash === previousHash) {
    info(`Level ${fileName} has not changed`, import.meta)
  } else {
    info(`Level ${fileName} has changed or is new`, import.meta)
    await writeFile(join('./hash', fileName), currentHash)
  }

  return {
    currentHash,
    previousHash
  }
}

export const createLevelHash = async (workshopPath: string) => {
  const { currentHash, previousHash } = await levelHash(workshopPath)

  const isNew = previousHash === ''

  return {
    hasChanged: currentHash !== previousHash,
    isNew
  }
}
