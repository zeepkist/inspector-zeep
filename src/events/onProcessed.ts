import { ThreadChannel } from 'discord.js'

import { SILENT_MODE } from '../config/constants.js'
import { saveLevelHashes } from '../createLevelHash.js'
import { sendPlaylist } from '../createPlaylist.js'
import { debug } from '../log.js'

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

    debug(`Set ${total} submissions`, import.meta, true)
  } else {
    debug(
      `Processed ${++processed} of ${total} (${getPercentage()}%)`,
      import.meta,
      true
    )

    if (processed === total) {
      debug(`Processed all ${processed} submissions`, import.meta, true)

      if (!SILENT_MODE) {
        await sendPlaylist(judgeChannel)
      }

      await saveLevelHashes()

      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(0)
    }
  }
}
