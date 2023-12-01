import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ThreadChannel
} from 'discord.js'

import { Level } from './types.js'

interface JudgeMessageOptions {
  channel: ThreadChannel
  level: Level
  isNew: boolean
}

const emoji = (isValid: boolean) =>
  isValid ? '<:zk_yes:1080204636583104573>' : '<:zk_no:1080204670418558987>'

export const sendJudgeMessage = async ({
  channel,
  level,
  isNew
}: JudgeMessageOptions) => {
  const {
    isOverBlockLimit,
    isOverTimeLimit,
    isUnderCheckpointLimit,
    isUnderTimeLimit
  } = level.validity
  const title = `[${isNew ? 'New' : 'Updated'}] ${level.name}`

  const authorTime = `${emoji(!isUnderTimeLimit && !isOverTimeLimit)} ${
    level.time
  }s`
  const blockCount = `${emoji(!isOverBlockLimit)} ${level.blocks}`
  const checkpointCount = `${emoji(!isUnderCheckpointLimit)} ${
    level.checkpoints
  }`

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setAuthor({
      name: level.author.username,
      iconURL: level.author.displayAvatarURL()
    })
    .setColor(level.isValid ? 0x00_ff_00 : 0xff_00_00)
    .addFields([
      {
        name: 'Author Time',
        value: authorTime,
		inline: true
      },
      {
        name: 'Block Count',
        value: blockCount,
		inline: true
      },
      {
        name: 'Checkpoints',
        value: checkpointCount,
		inline: true
      }
    ])

  const buttons = new ActionRowBuilder<ButtonBuilder>()

  if (level.isValid) {
    const url = `https://steamcommunity.com/sharedfiles/filedetails/?id=${level.workshopId}`

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
