import { exec } from 'node:child_process'
import { rename } from 'node:fs/promises'
import { promisify } from 'node:util'

import { event } from './event.js'
import { error, info } from './log.js'
import { Submission, Submissions } from './types.js'

function* chunks(items: [string, Submission][]) {
  let index = 0
  const count = 10
  for (; index < items.length; index++) {
    yield items.slice(index, index + count)
    index += count - 1
  }

  return []
}

const download = async (
  appId: string,
  query: string,
  workshopIds: string[],
  destinationPath: string
) => {
  const command = `steamcmd +login anonymous ${query} +quit`

  const execPromise = promisify(exec)
  try {
    await execPromise(command)

    for (const workshopId of workshopIds) {
      await rename(
        `${process.env.STEAMCMD_PATH}/steamapps/workshop/content/${appId}/${workshopId}`,
        `${destinationPath}/${workshopId}`
      )

      info(`Downloaded ${workshopId}`, import.meta, true)
      event.emit('downloaded', workshopId)
    }
  } catch (error_: unknown) {
    if (error_ instanceof Error) {
      error(`Error downloading workshop item: ${error_?.message}`, import.meta)
    } else {
      error(`Error downloading workshop item: ${error_}`, import.meta)
    }

    throw error
  }
}

interface DownloadSubmissionsOptions {
  submissions: Submissions
  downloadFolder: string
  appId: string
}

export const downloadSubmissions = async ({
  submissions,
  downloadFolder,
  appId
}: DownloadSubmissionsOptions) => {
  for await (const chunk of chunks([...submissions.entries()])) {
    const workshopIds = chunk.map(([workshopId]) => workshopId)
    info(`Downloading ${workshopIds}`, import.meta, true)

    const query = workshopIds
      .map(workshopId => `+workshop_download_item ${appId} ${workshopId}`)
      .join(' ')

    await download(appId, query, workshopIds, downloadFolder)
  }
}
