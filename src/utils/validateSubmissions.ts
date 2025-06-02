import { join } from 'node:path'
import type { ThreadChannel } from 'discord.js'

import { DOWNLOAD_FOLDER, SILENT_MODE } from '../config/index.js'
import { reactToMessage, sendJudgeMessage } from '../discord/index.js'
import type { Submissions } from '../types/index.js'
import { addToPlaylist, checkLevelIsValid, createLevelHash } from './index.js'

interface ValidateSubmissions {
	submissions: Submissions
	judgeChannel: ThreadChannel
}

export const validateSubmissions = async ({ submissions, judgeChannel }: ValidateSubmissions) => {
	for await (const [workshopId, [message, user]] of submissions.entries()) {
		const workshopPath = join(DOWNLOAD_FOLDER, workshopId)

		const level = await checkLevelIsValid(workshopPath, user)

		const { hasChanged, isNew, previousLevel } = await createLevelHash(workshopPath, user)

		if (!level) continue

		if ((hasChanged || isNew) && !SILENT_MODE) {
			await sendJudgeMessage({
				channel: judgeChannel,
				previousLevel,
				level,
				isNew,
			})
		}

		if (level.isValid) {
			await addToPlaylist(workshopPath, workshopId, hasChanged || isNew)
		}

		await reactToMessage(message, level.isValid)
	}
}
