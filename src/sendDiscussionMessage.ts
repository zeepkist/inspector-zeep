import { italic, ThreadChannel, User } from 'discord.js'

import {
  FIVE_DAYS_AGO,
  FIVE_MINUTES_AGO,
  SILENT_MODE
} from './config/constants.js'
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
    startFinishProximity,
    areFixedCheckpointsValid
  } = level.validity

  const hashedLevel = getLevelHash(level.workshopId)
  const invalidatedAt = hashedLevel?.invalidatedAt ?? FIVE_DAYS_AGO - 1

  // Don't send the message if the level has been invalidated less than 5 days ago
  if (invalidatedAt < FIVE_DAYS_AGO && invalidatedAt > FIVE_MINUTES_AGO) {
    debug(
      `"${level.name}" has been invalidated less than five days ago, not pinging user`,
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

  if (!areFixedCheckpointsValid) {
    messageContent += `- Fixed checkpoints have been moved, scaled or rotated out of position\n`
  }

  messageContent +=
    'You can resolve these issues by updating your workshop submission before the submission deadline! <:YannicWink:1108486419032309760>'

  console.log(SILENT_MODE, channel.id, messageContent)
  // TODO: Refactor invalidation logic
  // if (!SILENT_MODE) await channel.send(messageContent)
}
