import { Message, TextBasedChannel } from 'discord.js'

export const reactToMessage = async (
  channel: TextBasedChannel,
  message: Message,
  isValid: boolean
) =>
  await channel.messages.react(
    message,
    isValid ? '<:zk_yes:1080204636583104573>' : '<:zk_no:1080204670418558987>'
  )
