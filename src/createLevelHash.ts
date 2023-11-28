import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { gray, yellow } from 'colorette'

import { getLevelFile } from './getLevelFile.js'

const hashLevel = (level: string) => {
  const hash = createHash('sha256')

  hash.update(level)

  return hash.digest('hex')
}

const createLevelHash = async (workshopPath: string) => {
  const level = await getLevelFile(workshopPath)

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
    console.log(gray(`[Hash] Level ${fileName} has not changed`))
  } else {
    console.log(yellow(`[Hash] Level ${fileName} has changed or is new`))
    await writeFile(join('./hash', fileName), currentHash)
  }

  return {
    currentHash,
    previousHash
  }
}

export const hasLevelChanged = async (workshopPath: string) => {
  const { currentHash, previousHash } = await createLevelHash(workshopPath)

  const isNew = previousHash === ''

  return {
    hasChanged: currentHash !== previousHash,
    isNew
  }
}
