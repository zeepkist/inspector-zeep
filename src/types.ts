import { Message, User } from 'discord.js'

export type Submission = [Message, User]
export type Submissions = Map<string, Submission>

export interface Level {
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
