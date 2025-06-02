import { type Client, ThreadChannel } from 'discord.js'

import {
	DISCORD_DISCUSSION_CHANNEL_ID,
	DISCORD_JUDGE_CHANNEL_ID,
	DISCORD_SUBMISSION_CHANNEL_ID,
	FIVE_DAYS_AGO,
	SILENT_MODE,
} from '../config/index.js'
import { getChannelMessages } from '../discord/index.js'
import { debug, error } from './index.js'

const setupChannel = (client: Client, channelId = ''): ThreadChannel | undefined => {
	const channel = client.channels.cache.get(channelId)
	if (!channel || !(channel instanceof ThreadChannel)) {
		error(`Channel ${channelId} not found or is not a text channel`, import.meta)
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
		process.exit(1)
	}

	// Exit early if the submission channel is locked (i.e. the event is over)
	if (submissionChannel.locked && !SILENT_MODE) {
		error(`Submission channel ${submissionChannel.name} is locked`, import.meta)
		process.exit(0) // Exit with code 0 to prevent GitHub Actions from failing in-between events
	}

	if (!SILENT_MODE) {
		// Delete any bot messages sent in a previous run
		for await (const message of getChannelMessages(discussionChannel)) {
			if (message.author.bot && message.createdTimestamp > FIVE_DAYS_AGO) {
				debug(
					`Deleting bot message ${message.id} as it was created over 5 days ago`,
					import.meta,
					true,
				)

				// message.delete() // TODO: Uncomment this line
			}
		}
	}

	return {
		discussionChannel,
		submissionChannel,
		judgeChannel,
	}
}
