import { gray, red } from 'colorette'
import { Message, TextBasedChannel } from 'discord.js'

const queue: {
  channel: TextBasedChannel
  message: Message
  isValid: boolean
}[] = []
let isProcessingQueue = false

export const reactToMessage = async (
  channel: TextBasedChannel,
  message: Message,
  isValid: boolean
) => {
  queue.push({ channel, message, isValid })
  if (!isProcessingQueue) {
    isProcessingQueue = true
    processQueue()
  }
}

const processQueue = async () => {
  if (queue.length > 0) {
    console.debug(
      gray(`[Discord] Processing reaction queue with ${queue.length} items`)
    )

    const queueItem = queue.shift()
    if (queueItem) {
      const { message, isValid } = queueItem

      try {
        await message.reactions.removeAll()

        await message.react(
          isValid
            ? '<:zk_yes:1080204636583104573>'
            : '<:zk_no:1080204670418558987>'
        )
      } catch (error) {
        console.error(red(`[Discord] Error reacting to message: ${error}`))
        processQueue()
      }

      setTimeout(async () => {
        processQueue()
      }, 100)
    }
  } else {
    console.debug(gray(`[Discord] Finished processing reaction queue`))
    isProcessingQueue = false
  }
}
