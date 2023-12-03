import { ThreadChannel } from 'discord.js'

import { SILENT_MODE } from '../config/constants.js'
import { sendPlaylist } from '../createPlaylist.js'
import { info } from '../log.js'

let total = 0
let processed = 0

const getPercentage = () => Math.ceil((processed / total) * 100)

interface OnProcessedOptions {
  submissions: number
  judgeChannel: ThreadChannel
}

export const onProcessed = async ({
  submissions,
  judgeChannel
}: OnProcessedOptions) => {
  if (submissions > total) {
    total = submissions

    info(`Set ${total} submissions`, import.meta)
  } else {
    info(
      `Processed ${++processed} of ${total} (${getPercentage()}%)`,
      import.meta
    )

    if (processed === total) {
      info(`Processed all ${processed} submissions`, import.meta)

      if (!SILENT_MODE) {
        await sendPlaylist(judgeChannel)
      }

      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0)
    }
  }
}
