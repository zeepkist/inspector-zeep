import { User } from 'discord.js'

import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MAXIMUM_WIDTH,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME,
  START_FINISH_PROXIMITY
} from './config/requirements.js'
import { getLevel } from './getLevel.js'
import { debug, error } from './log.js'
import type { VerifiedLevel } from './types.js'

const getDistanceInBlocks = (distance: number) => Math.ceil(distance / 16)

export const validateBlockLimit = (name: string, blocks: number) => {
  if (blocks > BLOCK_LIMIT) {
    error(`"${name}" has ${blocks} blocks`, import.meta)
    return false
  } else {
    debug(`"${name}" has ${blocks} blocks`, import.meta, true)
    return true
  }
}

export const validateMinTime = (name: string, time: number) => {
  if (time < MINIMUM_TIME) {
    error(`"${name}" is ${time} seconds`, import.meta)
    return false
  } else {
    return true
  }
}

export const validateMaxTime = (name: string, time: number) => {
  if (time > MAXIMUM_TIME) {
    error(`"${name}" is ${time} seconds`, import.meta)
    return false
  } else {
    if (time > MINIMUM_TIME) {
      debug(`"${name}" is ${time} seconds`, import.meta, true)
    }
    return true
  }
}

const validateCheckpointLimit = (name: string, checkpoints: number) => {
  if (checkpoints < MINIMUM_CHECKPOINTS) {
    error(`"${name}" has ${checkpoints} checkpoints`, import.meta)
  } else {
    debug(`"${name}" has ${checkpoints} checkpoints`, import.meta, true)
  }

  return checkpoints < MINIMUM_CHECKPOINTS
}

const validateMaximumWidth = (name: string, lines: string[]) => {
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
    error(`"${name}" is ${width}x${height}x${depth}`, import.meta)
    return false
  }

  debug(`"${name}" is ${width}x${height}x${depth}`, import.meta, true)
  return true
}

const validateStartFinishProximity = (name: string, lines: string[]) => {
  const startBlockIds = new Set([1, 1363])
  const finishBlockIds = new Set([2, 1273, 1274, 1616])

  const startBlock = lines.find(line =>
    startBlockIds.has(Number(line.split(',')[0]))
  )

  const finishBlocks = lines.filter(line =>
    finishBlockIds.has(Number(line.split(',')[0]))
  )

  const distanceFromStartToFinish = 16 * 3 // 3 blocks

  if (!startBlock || finishBlocks.length === 0) {
    return {
      isStartFinishProximityValid: false,
      startFinishProximity: 0
    }
  }

  const [, startX, startY, startZ] = startBlock.split(',')

  let minimumDistanceDetected = Number.POSITIVE_INFINITY

  for (const finishBlock of finishBlocks) {
    const [, finishX, finishY, finishZ] = finishBlock.split(',')

    const distanceX = Math.abs(Number(startX) - Number(finishX))
    const distanceY = Math.abs(Number(startY) - Number(finishY))
    const distanceZ = Math.abs(Number(startZ) - Number(finishZ))
    const distance = Math.sqrt(
      Math.pow(distanceX, 2) + Math.pow(distanceY, 2) + Math.pow(distanceZ, 2)
    )
    const distanceInBlocks = getDistanceInBlocks(distance)

    if (distance < distanceFromStartToFinish) {
      return {
        isStartFinishProximityValid: true,
        startFinishProximity: distanceInBlocks
      }
    } else {
      minimumDistanceDetected = Math.min(minimumDistanceDetected, distance)
    }
  }

  const distanceInBlocks = getDistanceInBlocks(minimumDistanceDetected)

  error(
    `"${name}" start and finish are too far apart (${distanceInBlocks} blocks)`,
    import.meta
  )

  return {
    isStartFinishProximityValid: false,
    startFinishProximity: distanceInBlocks
  }
}

export const checkLevelIsValid = async (workshopPath: string, author: User) => {
  const level = await getLevel(workshopPath)
  if (!level) return

  const isOverBlockLimit = !validateBlockLimit(level.name, level.blocks.length)
  const isUnderTimeLimit = !validateMinTime(level.name, level.time)
  const isOverTimeLimit = !validateMaxTime(level.name, level.time)

  const isUnderCheckpointLimit = validateCheckpointLimit(
    level.name,
    level.checkpoints
  )

  const isOverWidthLimit =
    MAXIMUM_WIDTH === 0
      ? false
      : !validateMaximumWidth(level.name, level.blocks)

  const { isStartFinishProximityValid, startFinishProximity } =
    START_FINISH_PROXIMITY === 0
      ? { isStartFinishProximityValid: true, startFinishProximity: 0 }
      : validateStartFinishProximity(level.name, level.blocks)

  const response: VerifiedLevel = {
    workshopId: workshopPath.split('/').pop() ?? '',
    name: level.name,
    author,
    levelAuthors: level.author,
    time: level.time,
    blocks: level.blocks.length,
    checkpoints: level.checkpoints,
    isValid: !(
      isOverBlockLimit ||
      isUnderTimeLimit ||
      isOverTimeLimit ||
      isUnderCheckpointLimit ||
      isOverWidthLimit ||
      !isStartFinishProximityValid
    ),
    validity: {
      isOverBlockLimit,
      isUnderTimeLimit,
      isOverTimeLimit,
      isUnderCheckpointLimit,
      isOverWidthLimit,
      isStartFinishProximityValid,
      startFinishProximity
    }
  }

  return response
}
