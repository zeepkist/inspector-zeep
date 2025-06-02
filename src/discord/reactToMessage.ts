import type { Message } from 'discord.js'

import { error, info } from '../utils/index.js'

const REACTION_IDS = {
	YES: '1080204636583104573',
	NO: '1080204670418558987',
}

const REACTION_EMOJIS = {
	YES: '<:zk_yes:1080204636583104573>',
	NO: '<:zk_no:1080204670418558987>',
}

export const reactToMessage = async (message: Message, isValid: boolean) => {
	try {
		const reactionEmoji = isValid ? REACTION_EMOJIS.YES : REACTION_EMOJIS.NO
		const reactionToAdd = isValid ? REACTION_IDS.YES : REACTION_IDS.NO
		const reactionToRemove = isValid ? REACTION_IDS.NO : REACTION_IDS.YES

		const currentReaction = message.reactions.cache.find(
			(reaction) => reaction.emoji.id === reactionToAdd,
		)

		if (!currentReaction) {
			const reactionsToRemove = message.reactions.cache.filter(
				(reaction) => reaction.emoji.id === reactionToRemove,
			)

			for (const reaction of reactionsToRemove.values()) {
				await reaction.remove()
			}

			info(`Reacting to message with ${reactionEmoji}`, import.meta)

			await message.react(reactionEmoji)
		}
	} catch (error_) {
		error(`Error reacting to message: ${error_}`, import.meta)
	}
}
