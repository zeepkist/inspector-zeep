import { Message, ThreadChannel, User } from 'discord.js'

import { checkLevelIsValid } from '../checkLevelIsValid.js'
import { DOWNLOAD_FOLDER, SILENT_MODE } from '../config/constants.js'
import { START_FINISH_PROXIMITY } from '../config/requirements.js'
import { createLevelHash } from '../createLevelHash.js'
import { addToPlaylist } from '../createPlaylist.js'
import { event } from '../event.js'
import { reactToMessage } from '../reactToMessage.js'
import { sendDiscussionMessage } from '../sendDiscussionMessage.js'
import { sendJudgeMessage } from '../sendJudgeMessage.js'

interface onDownloadedOptions {
  workshopId: string
  submission: [Message, User]
  discussionChannel: ThreadChannel
  judgeChannel: ThreadChannel
}

export const onDownloaded = async ({
  workshopId,
  submission,
  discussionChannel,
  judgeChannel
}: onDownloadedOptions) => {
  const [message, user] = submission
  const workshopPath = `${DOWNLOAD_FOLDER}${workshopId}`
  const hasStartFinishProximityWarning = START_FINISH_PROXIMITY !== 0

  const level = await checkLevelIsValid(workshopPath, user)
  const { hasChanged, isNew, previousLevel } = await createLevelHash(
    workshopPath,
    user
  )

  if (!level) return

  if ((hasChanged || isNew) && !SILENT_MODE) {
    await sendJudgeMessage({
      channel: judgeChannel,
      previousLevel,
      level,
      isNew
    })
  }

  if (level.isValid) {
    await addToPlaylist(workshopPath, workshopId, hasChanged || isNew)
  }

  if (
    (!level.isValid ||
      (hasStartFinishProximityWarning &&
        !level.validity.isStartFinishProximityValid)) &&
    !SILENT_MODE
  ) {
    sendDiscussionMessage({
      channel: discussionChannel,
      level,
      user
    })
  }

  await reactToMessage(message, level.isValid)

  event.emit('processed')
}
