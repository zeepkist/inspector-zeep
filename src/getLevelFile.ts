import { opendir, readFile } from 'node:fs/promises'

import { yellow } from 'colorette'

const getFiles = async (path: string) => {
  const directory = await opendir(path)
  const files: string[] = []
  for await (const file of directory) {
    if (file.isDirectory()) {
      files.push(...(await getFiles(`${path}/${file.name}`)))
    } else {
      files.push(`${path}/${file.name}`)
    }
  }
  return files
}

export const getLevelFile = async (workshopPath: string) => {
  const files = await getFiles(workshopPath)

  const path = files.find(file => file.endsWith('.zeeplevel'))

  if (!path) {
    console.warn(yellow(`[Check] Level file not found in ${workshopPath}`))
    return
  }

  const level = await readFile(path, 'utf8')
  const name = path.split('/').pop()?.replace('.zeeplevel', '') ?? ''

  const levelLines = level.split(/\r?\n/)
  const blocks = levelLines.slice(3)
  const author = levelLines[0].split(',')[1]
  const uuid = levelLines[0].split(',')[2]
  const time = Number.parseFloat(levelLines[2].split(',')[0])

  return { level, name, path, blocks, author, uuid, time }
}
