import { opendir, readFile } from 'node:fs/promises'

import { gray, red, yellow } from 'colorette'
import { User } from 'discord.js'

import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME
} from './requirements.js'
import type { Level } from './types.js'

const getFiles = async (path: string) => {
  const directory = await opendir(path)
  const files: string[] = []
  for await (const file of directory) {
    if (file.isDirectory()) {
      files.push(...(await getFiles(`${path}/${file.name}`)))
    } else {
      files.push(`${path}/${file.name}`)
    }
  }
  return files
}

const validateBlockLimit = (blocks: number) => {
  if (blocks > BLOCK_LIMIT) {
    console.error(red(`[Check] Level has ${blocks} blocks`))
    return false
  } else {
    console.log(gray(`[Check] Level has ${blocks} blocks`))
    return true
  }
}

const validateMinTime = (time: number) => {
  if (time < MINIMUM_TIME) {
    console.error(red(`[Check] Level is ${time} seconds`))
    return false
  } else {
    return true
  }
}

const validateMaxTime = (time: number) => {
  if (time > MAXIMUM_TIME) {
    console.error(red(`[Check] Level is ${time} seconds`))
    return false
  } else {
    if (time > MINIMUM_TIME) {
      console.log(gray(`[Check] Level is ${time} seconds`))
    }
    return true
  }
}

const validateCheckpointLimit = (lines: string[]) => {
  const checkpointBlockIds = new Set([
    22, 372, 373, 1275, 1276, 1277, 1278, 1279
  ])

  const checkpoints = lines.filter(line => {
    const blockId = Number.parseInt(line.split(',')[0])
    return checkpointBlockIds.has(blockId)
  }).length

  if (checkpoints < MINIMUM_CHECKPOINTS) {
    console.error(red(`[Check] Level has ${checkpoints} checkpoints`))
    return false
  } else {
    return true
  }
}

export const checkLevelIsValid = async (workshopPath: string, author: User) => {
  const files = await getFiles(workshopPath)

  const levelFile = files.find(file => file.endsWith('.zeeplevel'))

  if (!levelFile) {
    console.warn(yellow(`[Check] Level file not found in ${workshopPath}`))
    return
  }

  const level = await readFile(levelFile, 'utf8')
  const levelLines = level.split(/\r?\n/)
  const blocks = levelLines.length - 4
  const time = Number.parseFloat(levelLines[2].split(',')[0])

  const isOverBlockLimit = !validateBlockLimit(blocks)
  const isUnderTimeLimit = !validateMinTime(time)
  const isOverTimeLimit = !validateMaxTime(time)
  const isUnderCheckpointLimit = !validateCheckpointLimit(levelLines)

  const response: Level = {
    workshopId: workshopPath.split('/').pop() ?? '',
    name: levelFile.split('/').pop()?.replace('.zeeplevel', '') ?? '',
    author,
    time,
    blocks,
    isValid: !(
      isOverBlockLimit ||
      isUnderTimeLimit ||
      isOverTimeLimit ||
      isUnderCheckpointLimit
    ),
    validity: {
      isOverBlockLimit,
      isUnderTimeLimit,
      isOverTimeLimit,
      isUnderCheckpointLimit
    }
  }

  return response
}
