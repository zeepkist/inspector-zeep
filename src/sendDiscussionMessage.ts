import { italic, ThreadChannel, User } from 'discord.js'

import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MAXIMUM_WIDTH,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME
} from './config/requirements.js'
import { getLevelHash } from './createLevelHash.js'
import { debug } from './log.js'
import type { VerifiedLevel } from './types.js'

interface SendDiscussionMessageOptions {
  channel: ThreadChannel
  level: VerifiedLevel
  user: User
}

export const sendDiscussionMessage = async ({
  channel,
  level,
  user
}: SendDiscussionMessageOptions) => {
  const {
    isOverBlockLimit,
    isOverTimeLimit,
    isUnderTimeLimit,
    isUnderCheckpointLimit,
    isOverWidthLimit,
    isStartFinishProximityValid,
    startFinishProximity
  } = level.validity

  const hashedLevel = getLevelHash(level.workshopId)
  const twoDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 2
  const FifteenMinutesAgo = Date.now() - 1000 * 60 * 15
  const invalidatedAt = hashedLevel?.invalidatedAt ?? 0

  // Don't send the message if the level has been invalidated less than three days ago
  if (invalidatedAt > twoDaysAgo && invalidatedAt < FifteenMinutesAgo) {
    debug(
      `"${level.name}" has been invalidated less than two days ago, not pinging user`,
      import.meta
    )

    return
  }

  let messageContent = `${user}, your submission (${italic(
    level.name
  )}) does not meet the following requirements:\n`

  if (isOverBlockLimit) {
    messageContent += `- Over the block limit of ${BLOCK_LIMIT} blocks\n`
  }

  if (isUnderTimeLimit || isOverTimeLimit) {
    messageContent += `- Author time is ${
      isOverTimeLimit ? 'over' : 'under'
    } the ${isOverTimeLimit ? 'maximum' : 'minimum'} of ${
      isOverTimeLimit ? MAXIMUM_TIME : MINIMUM_TIME
    } seconds\n`
  }

  if (isUnderCheckpointLimit) {
    messageContent += `- Less than the minimum of ${MINIMUM_CHECKPOINTS} checkpoints\n`
  }

  if (isOverWidthLimit) {
    const size = Math.floor(MAXIMUM_WIDTH) - 1
    messageContent += `- Over the maximum size of ${size}x${size}x${size} blocks\n`
  }

  if (!isStartFinishProximityValid) {
    messageContent += `- :warning: Start and finish are ${startFinishProximity} blocks apart. If your level re-uses part of the start for the end of the level (still forming a complete circuit), disregard this warning - your level is still valid.\n`
  }

  messageContent +=
    'You can resolve these issues by updating your workshop submission before the submission deadline! <:YannicWink:1108486419032309760>'

  await channel.send(messageContent)
}
