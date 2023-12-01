import { Client, ThreadChannel, User } from 'discord.js'

import { getChannelMessages } from './getChannelMessages.js'
import { error, info } from './log.js'

const twoDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 2

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

  const usersWithInvalidSubmissions = new Set<User['id']>()

  if (!discussionChannel || !submissionChannel || !judgeChannel) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  }

  // Delete any bot messages sent in a previous run
  for await (const message of getChannelMessages(discussionChannel)) {
    if (message.author.bot && message.createdTimestamp > twoDaysAgo) {
      info(`Deleting bot message ${message.id}`, import.meta, true)
      message.delete()
    } else if (message.author.bot) {
      // don't ping user again if they've already been pinged in the last 2 days
      // about their submission not being valid
      const user = message.mentions.users.first()
      if (!user) continue

      usersWithInvalidSubmissions.add(user.id)
    }
  }

  // Delete previous playlist attachments in the judge channel
  for await (const message of getChannelMessages(judgeChannel)) {
    if (message.author.bot && message.attachments.size > 0) {
      info(`Deleting playlist ${message.id}`, import.meta, true)
      message.delete()
    }
  }

  return {
    discussionChannel,
    submissionChannel,
    judgeChannel,
    usersWithInvalidSubmissions
  }
}
