import { Message } from 'discord.js'

import { error, info } from './log.js'

export const reactToMessage = async (message: Message, isValid: boolean) => {
  try {
    const reactionToRemove = isValid
      ? '1080204670418558987'
      : '1080204636583104573'

    const reactions = message.reactions.cache.filter(
      reaction => reaction.emoji.id === reactionToRemove
    )

    for (const reaction of reactions.values()) {
      await reaction.remove()
    }

    info(
      `Reacting to message with ${
        isValid
          ? '<:zk_yes:1080204636583104573>'
          : '<:zk_no:1080204670418558987>'
      }`,
      import.meta
    )

    message.react(
      isValid ? '<:zk_yes:1080204636583104573>' : '<:zk_no:1080204670418558987>'
    )
  } catch (error_) {
    error(`Error reacting to message: ${error_}`, import.meta)
  }
}
