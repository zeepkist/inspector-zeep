import { italic, TextBasedChannel, User } from 'discord.js'

import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME
} from './requirements.js'
import type { LevelValidity } from './types.js'

export const sendMessage = async (
  channel: TextBasedChannel,
  levelName: string,
  author: User,
  validity: LevelValidity
) => {
  const {
    isOverBlockLimit,
    isOverTimeLimit,
    isUnderTimeLimit,
    isUnderCheckpointLimit
  } = validity

  let messageContent = `${author}, your submission (${italic(
    levelName
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

  messageContent +=
    'You can resolve these issues by updating your workshop submission before the submission deadline! <:YannicWink:1108486419032309760>'

  await channel.send(messageContent)
}
