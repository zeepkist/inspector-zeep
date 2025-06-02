import { AttachmentBuilder, EmbedBuilder, type ThreadChannel, inlineCode } from 'discord.js'

import { SILENT_MODE } from '../config/index.js'
import { createPlaylist, debug, warn } from '../utils/index.js'
import { getChannelMessages } from './index.js'

export const sendPlaylist = async (channel: ThreadChannel) => {
	const playlist = createPlaylist()

	if (!playlist) {
		warn('No levels have changed, not sending playlist', import.meta)
		return
	}

	const embed = new EmbedBuilder()
		.setTitle('Latest Playlist')
		.setDescription(
			`Save it to ${inlineCode('%userprofile%/AppData/Roaming/Zeepkist/Playlists')}`,
		)
		.setColor(0xff_92_00)

	const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(playlist)), {
		name: `${playlist.name}.zeeplist`,
	})

	if (!SILENT_MODE) {
		// Delete previous playlist attachments in the judge channel
		for await (const message of getChannelMessages(channel)) {
			if (message.author.bot && message.attachments.size > 0) {
				debug(`Deleting playlist ${message.id}`, import.meta, true)
				message.delete()
			}
		}

		await channel.send({
			embeds: [embed],
			files: [attachment],
		})

		debug('Sent playlist', import.meta, true)
	}
}
