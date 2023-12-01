import { Client, ThreadChannel } from 'discord.js'

import { getChannelMessages } from './getChannelMessages.js'
import { error, info } from './log.js'

const setupChannel = (client: Client, channelId = ''): ThreadChannel | void => {
  const channel = client.channels.cache.get(channelId)
  if (!channel || !(channel instanceof ThreadChannel)) {
    error(
      `Channel ${channelId} not found or is not a text channel`,
      import.meta
    )
    client.destroy()
    return
  }

  info(`Channel ${channel.name} found`, import.meta, true)

  return channel
}

export const setupClient = async (client: Client) => {
  const discussionChannel = setupChannel(
    client,
    process.env.DISCORD_DISCUSSION_CHANNEL_ID
  )

  const submissionChannel = setupChannel(
    client,
    process.env.DISCORD_SUBMISSION_CHANNEL_ID
  )

  const judgeChannel = setupChannel(
    client,
    process.env.DISCORD_JUDGE_CHANNEL_ID
  )

  if (!discussionChannel || !submissionChannel || !judgeChannel) process.exit(1)

  // Delete any bot messages sent in a previous run
  for await (const message of getChannelMessages(discussionChannel)) {
    if (message.author.bot) {
      info(`Deleting bot message ${message.id}`, import.meta, true)
      message.delete()
    }
  }

  return {
    discussionChannel,
    submissionChannel,
    judgeChannel
  }
}
