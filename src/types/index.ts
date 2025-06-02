import type { Message, User } from 'discord.js'

export type Submission = [Message, User]
export type Submissions = Map<string, Submission>

export type ChangerGateBlockIdsByMode = {
	blockIds: Set<number>
	mode: string
	emoji: string
}

export type ChangerGate = Omit<ChangerGateBlockIdsByMode, 'blockIds'>

export interface Level {
	level: ZeepLevel
	name: string
	path: string
	blocks: ZeepLevelBlock[]
	author: ZeepLevelAuthor
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
	levelAuthors: ZeepLevelAuthor
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
	areFixedCheckpointsValid: boolean
	hasRequiredChangerGateModes: boolean
}

type NumberRange<
	Start extends number,
	End extends number,
	Acc extends number[] = [],
> = Acc['length'] extends End ? Acc[number] : NumberRange<Start, End, [...Acc, Acc['length']]>

type BlockDataRangeKeys<
	Prefix extends string,
	Start extends number,
	End extends number,
> = `${Prefix}${NumberRange<Start, End>}`

export interface ZeepLevelLevel {
	name: string
	UID: string
	zeepHash: string
}

export interface ZeepLevelAuthor {
	name: string
	StmID: number
	collaborators: null | string
	nameOverride: null | string
}

export interface ZeepLevelMedals {
	isLegit: boolean
	author: number
	gold: number
	silver: number
	bronze: number
}

export interface ZeepLevelBlockPosition {
	x: number // X position
	y: number // Y position
	z: number // Z position
}

export interface ZeepLevelBlockRotation {
	x: number // X rotation
	y: number // Y rotation
	z: number // Z rotation
}

export interface ZeepLevelBlockScale {
	x: number // X scale
	y: number // Y scale
	z: number // Z scale
}

export type ZeepLevelBlockDataProperties = {
	[key in
		| BlockDataRangeKeys<'p', 0, 6>
		| BlockDataRangeKeys<'a', 0, 2>
		| BlockDataRangeKeys<'b', 0, 6>
		| BlockDataRangeKeys<'o', 0, 6>
		| BlockDataRangeKeys<'ch', 0, 6>
		| BlockDataRangeKeys<'cl', 0, 4>]?: number
}

export interface ZeepLevelBlockData {
	n: null | ZeepLevelBlockDataProperties
}

export interface ZeepLevelBlock {
	i: number // Block ID
	u: string // UUID
	p: ZeepLevelBlockPosition // Position
	r: ZeepLevelBlockRotation // Rotation
	s: ZeepLevelBlockScale // Scale
	d: ZeepLevelBlockData // Data/Properties
}

export interface ZeepLevel {
	jsonVersion: number
	level: ZeepLevelLevel
	author: ZeepLevelAuthor
	medals: ZeepLevelMedals
	editcam: unknown // TODO: handle editcam
	enviro: unknown // TODO: handle enviro
	blox: ZeepLevelBlock[]
}
