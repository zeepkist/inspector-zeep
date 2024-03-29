import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ThreadChannel
} from 'discord.js'

import { CachedLevel, VerifiedLevel } from './types.js'

interface JudgeMessageOptions {
  channel: ThreadChannel
  previousLevel?: CachedLevel
  level: VerifiedLevel
  isNew: boolean
}

const emoji = (isValid: boolean) =>
  isValid ? '<:zk_yes:1080204636583104573>' : '<:zk_no:1080204670418558987>'

export const sendJudgeMessage = async ({
  channel,
  previousLevel,
  level,
  isNew
}: JudgeMessageOptions) => {
  const {
    isOverBlockLimit,
    isOverTimeLimit,
    isUnderCheckpointLimit,
    isUnderTimeLimit,
    isStartFinishProximityValid,
    startFinishProximity
  } = level.validity
  const title = `${isNew ? '🆕 ' : ''}${level.name}`

  const previousAuthorTime = previousLevel ? ` (${previousLevel.time}s)` : ''
  const authorTime = `${emoji(!isUnderTimeLimit && !isOverTimeLimit)} ${
    level.time
  }s${previousAuthorTime}`

  const previousBlockCount = previousLevel ? ` (${previousLevel.blocks})` : ''
  const blockCount = `${emoji(!isOverBlockLimit)} ${
    level.blocks
  }${previousBlockCount}`

  const previousCheckpointCount = previousLevel
    ? ` (${previousLevel.checkpoints})`
    : ''
  const checkpointCount = `${emoji(!isUnderCheckpointLimit)} ${
    level.checkpoints
  }${previousCheckpointCount}`

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

  if (previousLevel) {
    embed.setDescription(
      'Level information from before the update is in brackets'
    )
  }

  if (startFinishProximity > 0) {
    embed.addFields([
      {
        name: 'Start/Finish Proximity',
        value: `${emoji(isStartFinishProximityValid)} ${startFinishProximity} blocks`,
        inline: true
      }
    ])
  }

  const buttons = new ActionRowBuilder<ButtonBuilder>()
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
}
