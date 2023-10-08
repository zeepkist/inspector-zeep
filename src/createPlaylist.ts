import {
  AttachmentBuilder,
  EmbedBuilder,
  inlineCode,
  TextBasedChannel
} from 'discord.js'

import { getLevelFile } from './getLevelFile.js'

interface PlaylistLevel {
  UID: string
  WorkshopID: number
  Name: string
  Author: string
}

const LEVELS = new Set<PlaylistLevel>()

const createPlaylistName = () => {
  const name = process.env.ZEEPKIST_THEME_NAME || 'Playlist'

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
  workshopId: string
) => {
  const level = await getLevelFile(workshopPath)

  if (!level) return

  LEVELS.add({
    UID: level.uuid,
    WorkshopID: Number(workshopId),
    Name: level.name,
    Author: level.author
  })
}

export const sendPlaylist = async (channel: TextBasedChannel) => {
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

  await channel.send({
    embeds: [embed],
    files: [attachment]
  })
}
