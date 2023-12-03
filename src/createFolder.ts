import { mkdir } from 'node:fs/promises'

import { rimraf } from 'rimraf'

import { debug, error } from './log.js'

interface NodeJSWithCodeError extends Error {
  code?: string
}

export const createFolder = async (folder: string, cleanFolder = false) => {
  try {
    if (cleanFolder) await rimraf(folder)
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
