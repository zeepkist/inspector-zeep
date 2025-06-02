import { Events } from 'discord.js'

import { DOWNLOAD_FOLDER, HASH_FOLDER, SILENT_MODE } from './config/index.js'
import { sendPlaylist } from './discord/index.js'
import {
	createClient,
	createFolder,
	setupClient,
	getSubmissions,
	downloadSubmissions,
	validateSubmissions,
	saveLevelHashes
} from './utils/index.js'

const client = createClient()

await createFolder(HASH_FOLDER)
await createFolder(DOWNLOAD_FOLDER, true)

client.on(Events.ClientReady, async () => {
	const { discussionChannel, submissionChannel, judgeChannel } = await setupClient(client)
	const submissions = await getSubmissions(submissionChannel)

	console.log('Submissions fetched:', submissions.size)

	await downloadSubmissions(submissions)

	console.log('All submissions downloaded')

	await validateSubmissions({
		submissions,
		judgeChannel
	})

	if (!SILENT_MODE) {
		await sendPlaylist(judgeChannel)
	}

    await saveLevelHashes()

	console.log('All submissions processed')

	process.exit(0)
})
