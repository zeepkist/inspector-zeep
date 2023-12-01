import { mkdir } from 'node:fs/promises'

import { rimraf } from 'rimraf'

import { error, info } from './log.js'

export const createFolder = async (folder: string, cleanFolder = false) => {
  try {
    if (cleanFolder) await rimraf(folder)
    await mkdir(folder)

    info(`Folder ${folder} created`, import.meta, true)
  } catch (error_: unknown) {
    // Ignore error if folder already exists
    if (error_ instanceof Error) {
      error(error_.message, import.meta)
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1)
    }
  }
}
