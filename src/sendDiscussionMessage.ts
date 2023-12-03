import { italic, ThreadChannel, User } from 'discord.js'

import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MAXIMUM_WIDTH,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME
} from './config/requirements.js'
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
    isOverWidthLimit
  } = level.validity

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
    messageContent += `- Over the maximum size of ${size}x${size}x${size} blocks \n`
  }

  messageContent +=
    'You can resolve these issues by updating your workshop submission before the submission deadline! <:YannicWink:1108486419032309760>'

  await channel.send(messageContent)
}
