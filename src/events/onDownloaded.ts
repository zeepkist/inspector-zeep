import { Message, ThreadChannel, User } from 'discord.js'

import { checkLevelIsValid } from '../checkLevelIsValid.js'
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
  downloadFolder: string
}

export const onDownloaded = async ({
  workshopId,
  submission,
  discussionChannel,
  judgeChannel,
  downloadFolder
}: onDownloadedOptions) => {
  const [message, user] = submission
  const workshopPath = `${downloadFolder}${workshopId}`

  const level = await checkLevelIsValid(workshopPath, user)
  const { hasChanged, isNew } = await createLevelHash(workshopPath)

  if (!level) return

  if (hasChanged || isNew) {
    sendJudgeMessage({
      channel: judgeChannel,
      level,
      isNew
    })
  }

  if (level.isValid) {
    await addToPlaylist(workshopPath, workshopId)
  } else {
    sendDiscussionMessage({
      channel: discussionChannel,
      level,
      user
    })
  }

  reactToMessage(message, level.isValid)

  event.emit('processed')
}