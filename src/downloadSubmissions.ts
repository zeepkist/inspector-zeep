import { exec } from 'node:child_process'
import { rename } from 'node:fs/promises'
import { promisify } from 'node:util'

import { APP_ID, DOWNLOAD_FOLDER, STEAMCMD_PATH } from './config/constants.js'
import { event } from './event.js'
import { debug, error } from './log.js'
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

const download = async (query: string, workshopIds: string[]) => {
  const command = `steamcmd +login anonymous ${query} +quit`

  const execPromise = promisify(exec)
  try {
    await execPromise(command)

    for (const workshopId of workshopIds) {
      await rename(
        `${STEAMCMD_PATH}/steamapps/workshop/content/${APP_ID}/${workshopId}`,
        `${DOWNLOAD_FOLDER}/${workshopId}`
      )

      debug(`Downloaded ${workshopId}`, import.meta, true)
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

export const downloadSubmissions = async (submissions: Submissions) => {
  for await (const chunk of chunks([...submissions.entries()])) {
    const workshopIds = chunk.map(([workshopId]) => workshopId)
    debug(`Downloading ${workshopIds}`, import.meta, true)

    const query = workshopIds
      .map(workshopId => `+workshop_download_item ${APP_ID} ${workshopId}`)
      .join(' ')

    await download(query, workshopIds)
  }
}
