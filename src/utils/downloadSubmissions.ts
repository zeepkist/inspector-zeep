import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { copy, remove } from 'fs-extra'

import { APP_ID, DOWNLOAD_FOLDER, STEAMCMD_PATH } from '../config/index.js'
import type { Submissions, Submission } from '../types/index.js'
import { debug, error, warn } from './index.js'

const execPromise = promisify(exec)

function* chunks(items: [string, Submission][]) {
	let index = 0
	const count = 10
	for (; index < items.length; index++) {
		yield items.slice(index, index + count)
		index += count - 1
	}
}

const downloadBatch = async (
	batch: [string, Submission][],
	retryDepth = 0
): Promise<void> => {
	const workshopIds = batch.map(([id]) => id)
	const query = workshopIds.map(id => `+workshop_download_item ${APP_ID} ${id}`).join(' ')
	const command = `steamcmd +login anonymous ${query} +quit`

	try {
		const { stdout, stderr } = await execPromise(command)

		if (stdout) {
			// debug(`SteamCMD output: ${stdout}`, import.meta, true)
		}

		if (stderr) {
			error(`SteamCMD error output: ${stderr}`, import.meta)
		}

		for (const workshopId of workshopIds) {
			const sourcePath = `${STEAMCMD_PATH}/steamapps/workshop/content/${APP_ID}/${workshopId}`
			const targetPath = `${DOWNLOAD_FOLDER}/${workshopId}`

			try {
				await copy(sourcePath, targetPath, { overwrite: true })
				await remove(sourcePath)

				debug(`Downloaded ${workshopId}`, import.meta, true)
			} catch (err) {
				if ((err as NodeJS.ErrnoException).code === 'ENOENT' && batch.length === 1) {
					warn(`Workshop item ${workshopId} not found, skipping`, import.meta)
					continue
				}

				throw err
			}
		}
	} catch (err) {
		error(`Batch download failed (batch size: ${batch.length}): ${(err as Error).message}`, import.meta)

		if (batch.length === 1) {
			const [workshopId] = batch[0]
			warn(`Skipping workshop item ${workshopId} due to persistent failure`, import.meta)
			return
		}

		const mid = Math.floor(batch.length / 2)
		const left = batch.slice(0, mid)
		const right = batch.slice(mid)

		debug(`Retrying failed batch split into ${left.length} and ${right.length}`, import.meta)
		await downloadBatch(left, retryDepth + 1)
		await downloadBatch(right, retryDepth + 1)
	}
}

export const downloadSubmissions = async (submissions: Submissions) => {
	for await (const chunk of chunks([...submissions.entries()])) {
		await downloadBatch(chunk)
	}
}
