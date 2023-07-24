import { mkdir } from 'node:fs/promises'

import { blue, gray, green, red, yellow } from 'colorette'
import { Client, Events, GatewayIntentBits, User } from 'discord.js'
import { config } from 'dotenv'
import { rimraf } from 'rimraf'

import { checkLevelIsValid } from './checkLevelIsValid.js'
import { getAllMessages } from './getAllMessages.js'
import { sendMessage } from './sendMessage.js'
import { download } from './steamcmd.js'

config()

const DOWNLOAD_DIR = './downloads/'

const SUBMISSION_CHANNEL_ID = '1127296166401417256' // 50 Block Challenge
const DISCUSSION_CHANNEL_ID = '1127296735904022621' // 50 Block Challenge

const submissions = new Map<string, User>()

let processedSubmissions = 0

await rimraf(DOWNLOAD_DIR)
await mkdir(DOWNLOAD_DIR)

/*
function* chunks(items: [string, User][]) {
  let index = 0
  const count = 2
  for (; index < items.length; index++) {
    yield items.slice(index, index + count)
    index += count - 1
  }

  return []
}
*/

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
    if (message.author.bot) {
      console.debug(gray(`[Discord] Deleting bot message ${message.id}`))
      message.delete()
    }

    const link = message
      .toString()
      .match(
        /https:\/\/steamcommunity.com\/sharedfiles\/filedetails\/\?id=(\d+)/
      )

    if (message.attachments.size > 0) {
      console.warn(
        yellow(
          `[Discord] Message ${message.id} by ${message.author} contains attachments. Please check manually.`
        )
      )
    }

    if (!link) {
      console.warn(
        yellow(
          `[Discord] Message ${message.id} by ${message.author} does not contain a link`
        )
      )
      continue
    }

    submissions.set(link[1], message.author)
  }

  console.log(blue(`[Discord] Found ${submissions.size} submissions`))

  /*
  for (const chunk of chunks([...submissions.entries()])) {
    console.log(
      blue(
        `[Steam] Downloading ${chunk.length} levels (${
          submissions.size - processedSubmissions
        } remaining)`
      )
    )

    await Promise.all(
      chunk.map(async ([workshopId, author]) => {
        */
  for (const [workshopId, author] of submissions.entries()) {
    processedSubmissions++
    console.debug(
      blue(
        `[Inspector] Verifying ${workshopId}. ${
          submissions.size - processedSubmissions
        } remaining (${Math.trunc(
          (processedSubmissions / submissions.size) * 100
        )}%)`
      )
    )

    try {
      await download(workshopId, DOWNLOAD_DIR)
      const levelCheck = await checkLevelIsValid(
        `${DOWNLOAD_DIR}${workshopId}`,
        author
      )

      if (!levelCheck || levelCheck?.isValid) {
        continue
      }

      sendMessage(
        discussionChannel,
        levelCheck.name,
        author,
        levelCheck.validity
      )
    } catch (error) {
      console.error(
        red(`[Inspector] An error occured while processing ${workshopId}`),
        error
      )
    }
  }

  client.destroy()
})

client.login(process.env.DISCORD_TOKEN)
