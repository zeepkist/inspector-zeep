import { mkdir } from 'node:fs/promises'

import { rimraf } from 'rimraf'

import { error, info } from './log.js'

export const createFolder = async (folder: string, cleanFolder = false) => {
  try {
    if (cleanFolder) await rimraf(folder)
    await mkdir(folder)

    info(`Folder ${folder} created`, import.meta, true)
  } catch (error_: any) {
    // Ignore error if folder already exists
    if ((error_).code !== 'EEXIST') {
      error(error_, import.meta)
      process.exit(1)
    }
  }
}
