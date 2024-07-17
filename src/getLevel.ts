import { opendir, readFile } from 'node:fs/promises'

import { warn } from './log.js'
import { ChangerGateBlockIdsByMode, ChangerGate, Level } from './types.js'


const checkpointBlockIds = new Set([
  22, 372, 373, 1275, 1276, 1277, 1278, 1279, 1615
])

const logicBlockIds = new Set([
  1727, 1728, 1729, 1730, 1744, 2285, 2286
])

// 33rd argument === 1 = checkpoint changer gate setting on
const changerGateBlockIdsByMode = new Set<ChangerGateBlockIdsByMode>([
  {
    blockIds: new Set([1978, 1979, 1990]),
    mode: 'Invert Steering',
    emoji: '<:invert_steering:1263232209452794057>'
  },
  {
    blockIds: new Set([1980, 1981, 1991]),
    mode: 'Invert Arms Up Braking',
    emoji: '<:invert_arms_up_braking:1263232208278126685>'
  },
  {
    blockIds: new Set([1982, 1983, 1992]),
    mode: 'Offroad Wheels',
    emoji: '<:offroad_wheels:1263232210861817937>'
  },
  {
    blockIds: new Set([1984, 1985, 1993]),
    mode: 'Paraglider',
    emoji: '<:paraglider:1263232212153929870>'
  },
  {
    blockIds: new Set([1608, 1610, 1987]),
    mode: 'Soap Wheels',
    emoji: '<:soap_wheels:1263232213634257066>'
  }
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
    const hasTraditionalCheckpoint = checkpointBlockIds.has(blockId)

    if (hasTraditionalCheckpoint) return true

    for (const changerGateGroup of changerGateBlockIdsByMode) {
      const hasChangerGate = changerGateGroup.blockIds.has(blockId)

      if (hasChangerGate) {
        const changerGateSetting = Number.parseInt(line.split(',')[32])

        if (changerGateSetting === 1) {
          return true
        }
      }
    }

    return false
  }).length
}

const getChangerGateModes = (blocks: string[]) => {
  const modes = new Set<ChangerGate>()

  blocks.filter(line => {
    const blockId = Number.parseInt(line.split(',')[0])

    for (const changerGateGroup of changerGateBlockIdsByMode) {
      const hasChangerGate = changerGateGroup.blockIds.has(blockId)

      if (hasChangerGate) modes.add({
        mode: changerGateGroup.mode,
        emoji: changerGateGroup.emoji
      })
    }
  })

  const deduplicatedModes = Array.from(modes).filter((mode, index, self) => {
    return index === self.findIndex(t => (
      t.mode === mode.mode
    ))
  })

  return new Set(deduplicatedModes)
}

const getLogicBlocks = (blocks: string[]) => {
  return blocks.filter(line => {
    const blockId = Number.parseInt(line.split(',')[0])
    return logicBlockIds.has(blockId)
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
  const changerGateModes = getChangerGateModes(blocks)
  const logicBlocks = getLogicBlocks(blocks)

  const response: Level = {
    level,
    name,
    path,
    blocks,
    author,
    uuid,
    time,
    checkpoints,
    changerGateModes,
    logicBlocks
  }

  return response
}
