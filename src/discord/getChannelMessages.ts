import type { Collection, Message, ThreadChannel } from 'discord.js'

import { debug } from '../utils/log.js'

async function* messagesIterator(channel: ThreadChannel) {
	let before: string | undefined
	let isDone = false

	while (!isDone) {
		const messages: Collection<string, Message<boolean>> = await channel.messages.fetch({
			limit: 100,
			before,
		})

		if (messages.size > 0) {
			debug(`Found ${messages.size} messages in ${channel.name}`, import.meta, true)
			before = messages.lastKey()
			yield messages
		} else {
			isDone = true
		}
	}
}

export async function* getChannelMessages(channel: ThreadChannel) {
	for await (const messages of messagesIterator(channel)) {
		for (const message of messages.values()) {
			yield message
		}
	}
}
