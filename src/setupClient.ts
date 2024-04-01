import { Client, ThreadChannel } from 'discord.js'

import {
  DISCORD_DISCUSSION_CHANNEL_ID,
  DISCORD_JUDGE_CHANNEL_ID,
  DISCORD_SUBMISSION_CHANNEL_ID,
  SILENT_MODE
} from './config/constants.js'
import { getChannelMessages } from './getChannelMessages.js'
import { debug, error } from './log.js'

const fiveDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 5

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

  debug(`Channel ${channel.name} found`, import.meta, true)

  return channel
}

export const setupClient = async (client: Client) => {
  const discussionChannel = setupChannel(client, DISCORD_DISCUSSION_CHANNEL_ID)
  const submissionChannel = setupChannel(client, DISCORD_SUBMISSION_CHANNEL_ID)
  const judgeChannel = setupChannel(client, DISCORD_JUDGE_CHANNEL_ID)

  if (!discussionChannel || !submissionChannel || !judgeChannel) {
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  }

  // Exit early if the submission channel is locked (i.e. the event is over)
  if (submissionChannel.locked && !SILENT_MODE) {
    error(`Submission channel ${submissionChannel.name} is locked`, import.meta)
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  }

  if (!SILENT_MODE) {
    // Delete any bot messages sent in a previous run
    for await (const message of getChannelMessages(discussionChannel)) {
      if (message.author.bot && message.createdTimestamp < fiveDaysAgo) {
        debug(
          `Deleting bot message ${message.id} as it was created over 5 days ago`,
          import.meta,
          true
        )

        message.delete()
      }
    }
  }

  return {
    discussionChannel,
    submissionChannel,
    judgeChannel
  }
}
