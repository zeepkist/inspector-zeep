import { User } from 'discord.js'

export interface Level {
  workshopId: string
  name: string
  author: User
  time: number
  blocks: number
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
