import { mkdir } from 'node:fs/promises'

import { blue, gray, red, yellow } from 'colorette'
import { Client, Events, GatewayIntentBits, Message, User } from 'discord.js'
import { config } from 'dotenv'
import { rimraf } from 'rimraf'

import { checkLevelIsValid } from './checkLevelIsValid.js'
import { hasLevelChanged } from './createLevelHash.js'
import { addToPlaylist, sendPlaylist } from './createPlaylist.js'
import { getAllMessages } from './getAllMessages.js'
import { reactToMessage } from './reactToMessage.js'
import { sendJudgeMessage } from './sendJudgeMessage.js'
import { sendMessage } from './sendMessage.js'
import { download } from './steamcmd.js'

config()

const DOWNLOAD_DIR = './downloads/'
const HASH_DIR = './hash/'

const APP_ID = '1440670'
const DISCUSSION_CHANNEL_ID = process.env.DISCORD_DISCUSSION_CHANNEL_ID || ''
const SUBMISSION_CHANNEL_ID = process.env.DISCORD_SUBMISSION_CHANNEL_ID || ''
const JUDGE_CHANNEL_ID = process.env.DISCORD_JUDGE_CHANNEL_ID || ''

const submissions = new Map<string, [Message, User]>()

let processedSubmissions = 0

await rimraf(DOWNLOAD_DIR)
await mkdir(DOWNLOAD_DIR)

try {
  await mkdir(HASH_DIR)
} catch {
  // Ignore
}

function* chunks(items: [string, [Message, User]][]) {
  let index = 0
  const count = 10
  for (; index < items.length; index++) {
    yield items.slice(index, index + count)
    index += count - 1
  }

  return []
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
})

client.on(Events.ClientReady, async () => {
  console.debug(gray(`[Discord] Logged in as ${client.user?.tag}`))

  const discussionChannel = client.channels.cache.get(DISCUSSION_CHANNEL_ID)
  if (!discussionChannel || !discussionChannel.isTextBased()) {
    console.error(
      red(`[Discord] Discussion channel ${DISCUSSION_CHANNEL_ID} not found`)
    )
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
    console.error(
      red(`[Discord] Submission channel ${SUBMISSION_CHANNEL_ID} not found`)
    )
    client.destroy()
    return
  }

  const judgeChannel = client.channels.cache.get(JUDGE_CHANNEL_ID)
  if (!judgeChannel || !judgeChannel.isTextBased()) {
    console.error(red(`[Discord] Judge channel ${JUDGE_CHANNEL_ID} not found`))
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
        /https:\/\/steamcommunity\.com\/(?:sharedfiles|workshop)\/filedetails\/\?id=(\d+)/
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

    submissions.set(link[1], [message, message.author])
  }

  console.log(blue(`[Discord] Found ${submissions.size} submissions`))

  for await (const chunk of chunks([...submissions.entries()])) {
    const workshopIds = []
    let query = ''

    for (const [workshopId] of chunk) {
      query += ` +workshop_download_item ${APP_ID} ${workshopId}`
      workshopIds.push(workshopId)
    }

    console.debug(
      gray(`[Steam] Downloading ${chunk.length} workshop items: ${workshopIds}`)
    )

    await download(APP_ID, query, workshopIds, DOWNLOAD_DIR)

    // Verify levels
    for (const [workshopId, [message, author]] of chunk) {
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
        const workshopPath = `${DOWNLOAD_DIR}${workshopId}`
        const levelCheck = await checkLevelIsValid(workshopPath, author)
        const { hasChanged, isNew } = await hasLevelChanged(workshopPath)

        if (hasChanged) {
          sendJudgeMessage(
            judgeChannel,
            levelCheck?.name ?? '',
            levelCheck?.isValid ?? false,
            workshopId,
            workshopPath,
            isNew
          )
        }

        // Level is valid, add checkmark reaction
        if (!levelCheck || levelCheck?.isValid) {
          reactToMessage(message, true)
          await addToPlaylist(workshopPath, workshopId)
          continue
        }

        sendMessage(
          discussionChannel,
          levelCheck.name,
          author,
          levelCheck.validity
        )

        // Level is invalid, send message to discussion channel and add cross reaction
        reactToMessage(message, false)
      } catch (error) {
        console.error(
          red(`[Inspector] An error occured while processing ${workshopId}`),
          error
        )
      }
    }
  }

  await sendPlaylist(judgeChannel)

  client.destroy()
})

client.login(process.env.DISCORD_TOKEN)
