import { mkdir, readdir } from 'node:fs/promises'

import { rimraf } from 'rimraf'

import { debug, error } from './log.js'
import { join } from 'node:path'

interface NodeJSWithCodeError extends Error {
  code?: string
}

export const createFolder = async (folder: string, cleanFolder = false) => {
  try {
    if (cleanFolder) {
      const filesToDelete = await readdir(folder)

      for (const file of filesToDelete) {
        await rimraf(join(folder, file))
      }
    }
    await mkdir(folder)

    debug(`Folder ${folder} created`, import.meta, true)
  } catch (error_: unknown) {
    if (error_ instanceof Error) {
      const nodeError = error_ as NodeJSWithCodeError

      // Ignore error if folder already exists
      if (nodeError.code !== 'EEXIST') {
        error(error_.message, import.meta)
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1)
      }
    }
  }
}
