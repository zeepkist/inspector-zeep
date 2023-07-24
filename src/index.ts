import { mkdir } from 'node:fs/promises'

import { gray, green, red, yellow } from 'colorette'
import { Client, Events, GatewayIntentBits, italic } from 'discord.js'
import { config } from 'dotenv'
import { rimraf } from 'rimraf'

import {
  BLOCK_LIMIT,
  checkLevelIsValid,
  LEVELS,
  MAXIMUM_TIME,
  MINIMUM_CHECKPOINTS,
  MINIMUM_TIME
} from './checkLevelIsValid.js'
import { getAllMessages } from './getAllMessages.js'
import { download } from './steamcmd.js'

config()

const DOWNLOAD_DIR = './downloads/'

const SUBMISSION_CHANNEL_ID = '1127296166401417256' // 50 Block Challenge
const DISCUSSION_CHANNEL_ID = '1127296735904022621' // 50 Block Challenge

await rimraf(DOWNLOAD_DIR)
await mkdir(DOWNLOAD_DIR)

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
})

client.on(Events.ClientReady, async () => {
  console.debug(gray(`[Discord] Logged in as ${client.user?.tag}`))

  const discussionChannel = client.channels.cache.get(DISCUSSION_CHANNEL_ID)
  if (!discussionChannel || !discussionChannel.isTextBased()) {
    console.error(red(`[Discord] Channel ${DISCUSSION_CHANNEL_ID} not found`))
    client.destroy()
    return
  }

  for await (const message of getAllMessages(discussionChannel)) {
    console.debug(gray(`[Discord] Processing message ${message.id}`))

    if (message.author.bot) {
      console.debug(gray(`[Discord] Deleting bot message ${message.id}`))
      message.delete()
    }
  }

  const submissionChannel = client.channels.cache.get(SUBMISSION_CHANNEL_ID)
  if (!submissionChannel || !submissionChannel.isTextBased()) {
    console.error(red(`[Discord] Channel ${SUBMISSION_CHANNEL_ID} not found`))
    client.destroy()
    return
  }

  for await (const message of getAllMessages(submissionChannel)) {
    console.debug(gray(`[Discord] Processing message ${message.id}`))

    if (message.author.bot) {
      console.debug(gray(`[Discord] Deleting bot message ${message.id}`))
      message.delete()
    }

    const link = message
      .toString()
      .match(
        /https:\/\/steamcommunity.com\/sharedfiles\/filedetails\/\?id=(\d+)/
      )

    if (!link) {
      console.warn(
        yellow(
          `[Discord] Message ${message.id} by ${message.author} does not contain a link`
        )
      )
      continue
    }

    await download(link[1], DOWNLOAD_DIR)
    await checkLevelIsValid(`${DOWNLOAD_DIR}${link[1]}`, message.author)

    /*
    message[1].attachments.forEach(async (attachment) => {
      console.log(`[Discord] Processing attachment ${attachment}`)
    })
    */
  }

  console.log(green('[Discord] Finished processing messages'))

  for (const level of LEVELS) {
    let messageContent = `${level.author}, your submission (${italic(
      level.name
    )}) does not meet the following requirements:\n`

    if (level.overBlockLimit) {
      messageContent += `- Over the block limit of ${BLOCK_LIMIT} blocks\n`
    }

    if (level.underTimeLimit || level.overTimeLimit) {
      messageContent += `- Author time is ${
        level.overTimeLimit ? 'over' : 'under'
      } the ${level.overTimeLimit ? 'maximum' : 'minimum'} of ${
        level.overTimeLimit ? MAXIMUM_TIME : MINIMUM_TIME
      } seconds\n`
    }

    if (level.underCheckpointLimit) {
      messageContent += `- Less than the minimum of ${MINIMUM_CHECKPOINTS} checkpoints\n`
    }

    messageContent +=
      'You can fix these issues by updating your workshop submission before the submission deadline! <:YannicWink:1108486419032309760>'

    if (
      level.overBlockLimit ||
      level.underTimeLimit ||
      level.overTimeLimit ||
      level.underCheckpointLimit
    ) {
      await discussionChannel.send(messageContent)
    }
  }

  client.destroy()
})

client.login(process.env.DISCORD_TOKEN)

function* chunks(items: any[]) {
  let index = 0
  const count = 4
  for (; index < items.length; index++) {
    yield items.slice(index, index + count)
    index += count - 1
  }

  return []
}

for (const chunk of chunks([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
  console.log(chunk)
  /*
  await Promise.all(
    chunk.map(async item => {
      console.log(item)
    })
  )
  */
}
