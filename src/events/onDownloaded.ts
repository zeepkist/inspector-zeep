import { Message, ThreadChannel, User } from 'discord.js'

import { checkLevelIsValid } from '../checkLevelIsValid.js'
import { DOWNLOAD_FOLDER, SILENT_MODE } from '../config/constants.js'
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
  hasAlreadyPinged: boolean
}

export const onDownloaded = async ({
  workshopId,
  submission,
  discussionChannel,
  judgeChannel,
  hasAlreadyPinged
}: onDownloadedOptions) => {
  const [message, user] = submission
  const workshopPath = `${DOWNLOAD_FOLDER}${workshopId}`

  const level = await checkLevelIsValid(workshopPath, user)
  const { hasChanged, isNew, previousLevel } =
    await createLevelHash(workshopPath)

  if (!level) return

  if ((hasChanged || isNew) && !SILENT_MODE) {
    sendJudgeMessage({
      channel: judgeChannel,
      previousLevel,
      level,
      isNew
    })
  }

  if (level.isValid) {
    await addToPlaylist(workshopPath, workshopId, hasChanged || isNew)
  } else if (!hasAlreadyPinged && !SILENT_MODE) {
    sendDiscussionMessage({
      channel: discussionChannel,
      level,
      user
    })
  }

  reactToMessage(message, level.isValid)

  event.emit('processed')
}
