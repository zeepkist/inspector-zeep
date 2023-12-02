import {
  AttachmentBuilder,
  EmbedBuilder,
  inlineCode,
  ThreadChannel
} from 'discord.js'

import { SILENT_MODE, ZEEPKIST_THEME_NAME } from './config/constants.js'
import { getChannelMessages } from './getChannelMessages.js'
import { getLevel } from './getLevel.js'
import { info } from './log.js'

interface PlaylistLevel {
  UID: string
  WorkshopID: number
  Name: string
  Author: string
}

let hasPlaylistBeenInvalidated = false

const LEVELS = new Set<PlaylistLevel>()

const createPlaylistName = () => {
  const name = ZEEPKIST_THEME_NAME || 'Playlist'

  return `${name} - ${LEVELS.size}`
}

const createPlaylist = () => {
  const playlist = {
    name: createPlaylistName(),
    amountOfLevels: LEVELS.size,
    roundLength: 420,
    shufflePlaylist: false,
    UID: [],
    levels: [...LEVELS]
  }

  return playlist
}

export const addToPlaylist = async (
  workshopPath: string,
  workshopId: string,
  invalidatePlaylist = false
) => {
  const level = await getLevel(workshopPath)

  if (!level) return

  hasPlaylistBeenInvalidated = invalidatePlaylist

  LEVELS.add({
    UID: level.uuid,
    WorkshopID: Number(workshopId),
    Name: level.name,
    Author: level.author
  })
}

export const sendPlaylist = async (channel: ThreadChannel) => {
  if (!hasPlaylistBeenInvalidated) return

  const playlist = createPlaylist()

  const embed = new EmbedBuilder()
    .setTitle(`Latest Playlist`)
    .setDescription(
      `Save it to ${inlineCode(
        '%userprofile%/AppData/Roaming/Zeepkist/Playlists'
      )}`
    )
    .setColor(0xff_92_00)

  const attachment = new AttachmentBuilder(
    Buffer.from(JSON.stringify(playlist)),
    { name: `${createPlaylistName()}.zeeplist` }
  )

  if (!SILENT_MODE) {
    // Delete previous playlist attachments in the judge channel
    for await (const message of getChannelMessages(channel)) {
      if (message.author.bot && message.attachments.size > 0) {
        info(`Deleting playlist ${message.id}`, import.meta, true)
        message.delete()
      }
    }

    await channel.send({
      embeds: [embed],
      files: [attachment]
    })
  }
}
