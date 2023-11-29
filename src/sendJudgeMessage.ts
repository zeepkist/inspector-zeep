import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  italic,
  TextBasedChannel
} from 'discord.js'

import { getLevelFile } from './getLevelFile.js'

export const sendJudgeMessage = async (
  channel: TextBasedChannel,
  levelName: string,
  isValid: boolean,
  workshopId: string,
  workshopPath: string,
  isNew: boolean
) => {
  const level = await getLevelFile(workshopPath)

  const title = `${isNew ? 'New level added' : 'Level updated'}`

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `${italic(levelName)} has been ${isNew ? 'added' : 'updated'} by ${
        level?.author ?? 'N/A'
      }!`
    )
    .setColor(isValid ? (isNew ? 0x00_00_ff : 0x00_ff_00) : 0xff_00_00)

  const buttons = new ActionRowBuilder<ButtonBuilder>()

  if (isValid) {
    const url = `https://steamcommunity.com/sharedfiles/filedetails/?id=${workshopId}`

    buttons.addComponents([
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('Subscribe to level')
        .setURL(url)
    ])

    await channel.send({
      embeds: [embed],
      components: [buttons]
    })
  } else {
    await channel.send({
      embeds: [embed]
    })
  }
}
