import { Message, User } from 'discord.js'

export type Submission = [Message, User]
export type Submissions = Map<string, Submission>

export type ChangerGateBlockIdsByMode = {
  blockIds: Set<number>
  mode: string
  emoji: string
}

export type ChangerGate = Omit<ChangerGateBlockIdsByMode, "blockIds">


export interface Level {
  level: string
  name: string
  path: string
  blocks: string[]
  author: string
  uuid: string
  time: number
  checkpoints: number
  changerGateModes: Set<ChangerGate>
  logicBlocks: number
}

export interface CachedLevel extends Omit<Level, 'level' | 'blocks'> {
  blocks: number
}

export interface VerifiedLevel {
  workshopId: string
  name: string
  author: User
  levelAuthors: string
  time: number
  blocks: number
  checkpoints: number
  changerGateModes: Set<ChangerGate>
  logicBlocks: number
  isValid: boolean
  validity: LevelValidity
}

export interface LevelValidity {
  isOverBlockLimit: boolean
  isUnderTimeLimit: boolean
  isOverTimeLimit: boolean
  isUnderCheckpointLimit: boolean
  isOverWidthLimit: boolean
  isStartFinishProximityValid: boolean
  startFinishProximity: number
  areFixedCheckpointsValid: boolean
  hasRequiredChangerGateModes: boolean
}
