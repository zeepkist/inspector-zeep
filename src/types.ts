import { Message, User } from 'discord.js'

export type Submission = [Message, User]
export type Submissions = Map<string, Submission>

export interface Level {
  level: string
  name: string
  path: string
  blocks: string[]
  author: string
  uuid: string
  time: number
  checkpoints: number
}

export interface CachedLevel extends Omit<Level, 'level' | 'blocks'> {
  blocks: number
}

export interface VerifiedLevel {
  workshopId: string
  name: string
  author: User
  time: number
  blocks: number
  checkpoints: number
  isValid: boolean
  validity: LevelValidity
}

export interface LevelValidity {
  isOverBlockLimit: boolean
  isUnderTimeLimit: boolean
  isOverTimeLimit: boolean
  isUnderCheckpointLimit: boolean
  isOverWidthLimit: boolean
}
