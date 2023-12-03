import { Message, ThreadChannel } from 'discord.js'

import { getChannelMessages } from './getChannelMessages.js'
import { debug, warn } from './log.js'
import { Submissions } from './types.js'

const getWorkshopId = (message: Message) => {
  const link = message.content.match(
    /https:\/\/steamcommunity\.com\/(?:sharedfiles|workshop)\/filedetails\/\?id=(\d+)/
  )

  return link ? link[1] : undefined
}

const displayMessageInfo = (message: Message) =>
  `Message ${message.id} by ${message.author} (${message.author.displayName})`

export const getSubmissions = async (channel: ThreadChannel) => {
  const submissions: Submissions = new Map()

  for await (const message of getChannelMessages(channel)) {
    const workshopId = getWorkshopId(message)

    if (!workshopId && message.attachments.size > 0) {
      warn(
        `${displayMessageInfo(
          message
        )} contains attachments. Please check manually.`,
        import.meta
      )
      continue
    } else if (!workshopId) {
      warn(
        `${displayMessageInfo(message)} does not contain a link`,
        import.meta
      )
      continue
    }

    submissions.set(workshopId, [message, message.author])
  }

  debug(`Found ${submissions.size} submissions`, import.meta)

  return submissions
}
