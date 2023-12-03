import { opendir, readFile } from 'node:fs/promises'

import { warn } from './log.js'
import { Level } from './types.js'

const checkpointBlockIds = new Set([
  22, 372, 373, 1275, 1276, 1277, 1278, 1279, 1615
])

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

const getCheckpoints = (blocks: string[]) => {
  return blocks.filter(line => {
    const blockId = Number.parseInt(line.split(',')[0])
    return checkpointBlockIds.has(blockId)
  }).length
}

export const getLevel = async (workshopPath: string) => {
  const files = await getFiles(workshopPath)

  const path = files.find(file => file.endsWith('.zeeplevel'))

  if (!path) {
    warn(`Level file not found in ${workshopPath}`, import.meta)
    return
  }

  const level = await readFile(path, 'utf8')
  const name = path.split('/').pop()?.replace('.zeeplevel', '') ?? ''

  const levelLines = level.split(/\r?\n/)
  const blocks = levelLines.slice(3)
  const author = levelLines[0].split(',')[1]
  const uuid = levelLines[0].split(',')[2]
  const time = Number.parseFloat(levelLines[2].split(',')[0])
  const checkpoints = getCheckpoints(blocks)

  const response: Level = {
    level,
    name,
    path,
    blocks,
    author,
    uuid,
    time,
    checkpoints
  }

  return response
}
