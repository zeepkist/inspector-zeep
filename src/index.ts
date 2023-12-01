import { Events } from 'discord.js'

import { createClient } from './createClient.js'
import { createFolder } from './createFolder.js'
import { downloadSubmissions } from './downloadSubmissions.js'
import { event } from './event.js'
import { onDownloaded } from './events/onDownloaded.js'
import { onProcessed } from './events/onProcessed.js'
import { getSubmissions } from './getSubmissions.js'
import { setupClient } from './setupClient.js'

const APP_ID = '1440670'
const DOWNLOAD_FOLDER = './downloads/'
const HASH_FOLDER = './hash/'

const client = createClient()

await createFolder(HASH_FOLDER)
await createFolder(DOWNLOAD_FOLDER, true)

client.on(Events.ClientReady, async () => {
  const { discussionChannel, submissionChannel, judgeChannel } =
    await setupClient(client)
  const submissions = await getSubmissions(submissionChannel)

  event.on('processed', (submissions: number) => {
    onProcessed({
      submissions,
      judgeChannel
    })
  })

  event.on('downloaded', (workshopId: string) => {
    const submission = submissions.get(workshopId)
    if (!submission) return

    onDownloaded({
      workshopId,
      submission,
      discussionChannel,
      judgeChannel,
      downloadFolder: DOWNLOAD_FOLDER
    })
  })

  // Initialise the processed submissions count so we can exit when we're done
  event.emit('processed', submissions.size)

  await downloadSubmissions({
    submissions,
    downloadFolder: DOWNLOAD_FOLDER,
    appId: APP_ID
  })
})
