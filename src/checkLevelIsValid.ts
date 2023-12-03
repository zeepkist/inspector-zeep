import { User } from 'discord.js'

import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MAXIMUM_WIDTH,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME
} from './config/requirements.js'
import { getLevel } from './getLevel.js'
import { debug, error } from './log.js'
import type { VerifiedLevel } from './types.js'

export const validateBlockLimit = (blocks: number) => {
  if (blocks > BLOCK_LIMIT) {
    error(`Level has ${blocks} blocks`, import.meta)
    return false
  } else {
    debug(`Level has ${blocks} blocks`, import.meta, true)
    return true
  }
}

export const validateMinTime = (time: number) => {
  if (time < MINIMUM_TIME) {
    error(`Level is ${time} seconds`, import.meta)
    return false
  } else {
    return true
  }
}

export const validateMaxTime = (time: number) => {
  if (time > MAXIMUM_TIME) {
    error(`Level is ${time} seconds`, import.meta)
    return false
  } else {
    if (time > MINIMUM_TIME) {
      debug(`Level is ${time} seconds`, import.meta, true)
    }
    return true
  }
}

const validateCheckpointLimit = (checkpoints: number) => {
  if (checkpoints < MINIMUM_CHECKPOINTS) {
    error(`Level has ${checkpoints} checkpoints`, import.meta)
  } else {
    debug(`Level has ${checkpoints} checkpoints`, import.meta, true)
  }

  return checkpoints < MINIMUM_CHECKPOINTS
}

const validateMaximumWidth = (lines: string[]) => {
  // Skip validation if no width limit
  if (MAXIMUM_WIDTH === 0) return true

  const minimumPosition = {
    x: Number.POSITIVE_INFINITY,
    y: Number.POSITIVE_INFINITY,
    z: Number.POSITIVE_INFINITY
  }

  const maximumPosition = {
    x: Number.NEGATIVE_INFINITY,
    y: Number.NEGATIVE_INFINITY,
    z: Number.NEGATIVE_INFINITY
  }

  // Remove header lines
  lines.splice(0, 3)

  for (const line of lines) {
    // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
    const [blockId, x, y, z, , , , scaleX, scaleY, scaleZ] = line.split(',')

    if (blockId === '0') continue

    if (Number(x) < minimumPosition.x && Number(scaleX) <= 1) {
      minimumPosition.x =
        Number(scaleX) > 1 ? Number(x) + Number(scaleX) : Number(x)
    }

    if (Number(y) < minimumPosition.y && Number(scaleY) <= 1) {
      minimumPosition.y =
        Number(scaleY) > 1 ? Number(y) + Number(scaleY) : Number(y)
    }

    if (Number(z) < minimumPosition.z && Number(scaleZ) <= 1) {
      minimumPosition.z =
        Number(scaleZ) > 1 ? Number(z) + Number(scaleZ) : Number(z)
    }

    if (Number(x) > maximumPosition.x && Number(scaleX) <= 1) {
      maximumPosition.x =
        Number(scaleX) > 1 ? Number(x) - Number(scaleX) : Number(x)
    }

    if (Number(y) > maximumPosition.y && Number(scaleY) <= 1) {
      maximumPosition.y =
        Number(scaleY) > 1 ? Number(y) - Number(scaleY) : Number(y)
    }

    if (Number(z) > maximumPosition.z && Number(scaleZ) <= 1) {
      maximumPosition.z =
        Number(scaleZ) > 1 ? Number(z) - Number(scaleZ) : Number(z)
    }
  }

  const width = (maximumPosition.x - minimumPosition.x) / 16
  const height = (maximumPosition.y - minimumPosition.y) / 16
  const depth = (maximumPosition.z - minimumPosition.z) / 16

  if (
    width > MAXIMUM_WIDTH ||
    height > MAXIMUM_WIDTH ||
    depth > MAXIMUM_WIDTH
  ) {
    error(`Level is ${width}x${height}x${depth}`, import.meta)
    return false
  }

  debug(`Level is ${width}x${height}x${depth}`, import.meta, true)
  return true
}

export const checkLevelIsValid = async (workshopPath: string, author: User) => {
  const level = await getLevel(workshopPath)
  if (!level) return

  const isOverBlockLimit = !validateBlockLimit(level.blocks.length)
  const isUnderTimeLimit = !validateMinTime(level.time)
  const isOverTimeLimit = !validateMaxTime(level.time)
  const isUnderCheckpointLimit = validateCheckpointLimit(level.checkpoints)
  const isOverWidthLimit =
    MAXIMUM_WIDTH === 0 ? false : !validateMaximumWidth(level.blocks)

  const response: VerifiedLevel = {
    workshopId: workshopPath.split('/').pop() ?? '',
    name: level.name,
    author,
    time: level.time,
    blocks: level.blocks.length,
    checkpoints: level.checkpoints,
    isValid: !(
      isOverBlockLimit ||
      isUnderTimeLimit ||
      isOverTimeLimit ||
      isUnderCheckpointLimit ||
      isOverWidthLimit
    ),
    validity: {
      isOverBlockLimit,
      isUnderTimeLimit,
      isOverTimeLimit,
      isUnderCheckpointLimit,
      isOverWidthLimit
    }
  }

  return response
}
