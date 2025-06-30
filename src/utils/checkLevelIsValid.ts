import type { User } from 'discord.js'

import {
	BLOCK_LIMIT,
	BLOCK_LIMIT_MIN,
	CHANGER_GATE_MODES_REQUIRED,
	FIXED_CHECKPOINTS,
	MAXIMUM_TIME,
	MAXIMUM_WIDTH,
	MINIMUM_CHECKPOINTS,
	MINIMUM_TIME,
} from '../config/index.js'
import type { ChangerGate, VerifiedLevel, ZeepLevelBlock } from '../types/index.js'
import { getLevel } from './getLevel.js'
import { debug, error } from './log.js'

export const validateBlockLimit = (name: string, blocks: number) => {
	if (blocks > BLOCK_LIMIT || blocks < BLOCK_LIMIT_MIN) {
		error(`"${name}" has ${blocks} blocks`, import.meta)
		return false
	}

	debug(`"${name}" has ${blocks} blocks`, import.meta, true)
	return true
}

export const validateMinTime = (name: string, time: number) => {
	if (time < MINIMUM_TIME) {
		error(`"${name}" is ${time} seconds`, import.meta)
		return false
	}
	return true
}

export const validateMaxTime = (name: string, time: number) => {
	if (time > MAXIMUM_TIME) {
		error(`"${name}" is ${time} seconds`, import.meta)
		return false
	}
	if (time > MINIMUM_TIME) {
		debug(`"${name}" is ${time} seconds`, import.meta, true)
	}
	return true
}

const validateCheckpointLimit = (name: string, checkpoints: number) => {
	if (checkpoints < MINIMUM_CHECKPOINTS) {
		error(`"${name}" has ${checkpoints} checkpoints`, import.meta)
	} else {
		debug(`"${name}" has ${checkpoints} checkpoints`, import.meta, true)
	}

	return checkpoints < MINIMUM_CHECKPOINTS
}

const validateMaximumWidth = (name: string, blocks: ZeepLevelBlock[]) => {
	// Skip validation if no width limit
	if (MAXIMUM_WIDTH === 0) return true

	const minimumPosition = {
		x: Number.POSITIVE_INFINITY,
		y: Number.POSITIVE_INFINITY,
		z: Number.POSITIVE_INFINITY,
	}

	const maximumPosition = {
		x: Number.NEGATIVE_INFINITY,
		y: Number.NEGATIVE_INFINITY,
		z: Number.NEGATIVE_INFINITY,
	}

	for (const block of blocks) {
		const { x, y, z } = block.p
		const { x: scaleX, y: scaleY, z: scaleZ } = block.s

		if (Number(x) < minimumPosition.x && Number(scaleX) <= 1) {
			minimumPosition.x = Number(scaleX) > 1 ? Number(x) + Number(scaleX) : Number(x)
		}

		if (Number(y) < minimumPosition.y && Number(scaleY) <= 1) {
			minimumPosition.y = Number(scaleY) > 1 ? Number(y) + Number(scaleY) : Number(y)
		}

		if (Number(z) < minimumPosition.z && Number(scaleZ) <= 1) {
			minimumPosition.z = Number(scaleZ) > 1 ? Number(z) + Number(scaleZ) : Number(z)
		}

		if (Number(x) > maximumPosition.x && Number(scaleX) <= 1) {
			maximumPosition.x = Number(scaleX) > 1 ? Number(x) - Number(scaleX) : Number(x)
		}

		if (Number(y) > maximumPosition.y && Number(scaleY) <= 1) {
			maximumPosition.y = Number(scaleY) > 1 ? Number(y) - Number(scaleY) : Number(y)
		}

		if (Number(z) > maximumPosition.z && Number(scaleZ) <= 1) {
			maximumPosition.z = Number(scaleZ) > 1 ? Number(z) - Number(scaleZ) : Number(z)
		}
	}

	const width = (maximumPosition.x - minimumPosition.x) / 16
	const height = (maximumPosition.y - minimumPosition.y) / 16
	const depth = (maximumPosition.z - minimumPosition.z) / 16

	if (width > MAXIMUM_WIDTH || height > MAXIMUM_WIDTH || depth > MAXIMUM_WIDTH) {
		error(`"${name}" is ${width}x${height}x${depth}`, import.meta)
		return false
	}

	debug(`"${name}" is ${width}x${height}x${depth}`, import.meta, true)
	return true
}

const validateFixedCheckpoints = (name: string, blocks: ZeepLevelBlock[]) => {
	// console.debug('lines', lines)
	const fixedCheckpointsFound = blocks.filter((block) =>
		FIXED_CHECKPOINTS.some((checkpoint) => block.i === checkpoint),
	)

	const missingFixedCheckpoints = FIXED_CHECKPOINTS.filter(
		(checkpoint) => !fixedCheckpointsFound.some((block) => block.i === checkpoint),
	)

	if (fixedCheckpointsFound.length !== FIXED_CHECKPOINTS.length) {
		error(`"${name}" is missing fixed checkpoints`, import.meta)

		for (const fixedCheckpoint of fixedCheckpointsFound) {
			debug(`Found "${fixedCheckpoint}"`, import.meta, true)
		}

		for (const missingFixedCheckpoint of missingFixedCheckpoints) {
			error(`Missing "${missingFixedCheckpoint}"`, import.meta)
		}

		return false
	}

	debug(`"${name}" has fixed checkpoints`, import.meta, true)
	return true
}

const validateRequiredChangerGateModes = (name: string, changerGateModes: Set<ChangerGate>) => {
	if (CHANGER_GATE_MODES_REQUIRED.size === 0) return true

	const missingChangerGateModes = new Set(
		[...CHANGER_GATE_MODES_REQUIRED].filter(
			(changerGateMode) =>
				![...changerGateModes].some((mode) => mode.mode === changerGateMode),
		),
	)

	if (missingChangerGateModes.size > 0) {
		error(`"${name}" is missing changer gate modes`, import.meta)

		for (const missingChangerGateMode of missingChangerGateModes) {
			error(`Missing "${missingChangerGateMode}"`, import.meta)
		}

		return false
	}

	debug(`"${name}" has required changer gate modes`, import.meta, true)
	return true
}

export const checkLevelIsValid = async (workshopPath: string, author: User) => {
	const level = await getLevel(workshopPath)
	if (!level) return

	const isOverBlockLimit = !validateBlockLimit(level.name, level.blocks.length)
	const isUnderTimeLimit = !validateMinTime(level.name, level.time)
	const isOverTimeLimit = !validateMaxTime(level.name, level.time)

	const isUnderCheckpointLimit = validateCheckpointLimit(level.name, level.checkpoints)

	const isOverWidthLimit =
		MAXIMUM_WIDTH === 0 ? false : !validateMaximumWidth(level.name, level.blocks)

	const areFixedCheckpointsValid = validateFixedCheckpoints(level.name, level.blocks)

	const hasRequiredChangerGateModes = validateRequiredChangerGateModes(
		level.name,
		level.changerGateModes,
	)

	const response: VerifiedLevel = {
		workshopId: workshopPath.split('/').pop() ?? '',
		name: level.name,
		author,
		levelAuthors: level.author,
		time: level.time,
		blocks: level.blocks.length,
		checkpoints: level.checkpoints,
		changerGateModes: level.changerGateModes,
		logicBlocks: level.logicBlocks,
		isValid: !(
			isOverBlockLimit ||
			isUnderTimeLimit ||
			isOverTimeLimit ||
			isUnderCheckpointLimit ||
			isOverWidthLimit ||
			!areFixedCheckpointsValid ||
			!hasRequiredChangerGateModes
		),
		validity: {
			isOverBlockLimit,
			isUnderTimeLimit,
			isOverTimeLimit,
			isUnderCheckpointLimit,
			isOverWidthLimit,
			areFixedCheckpointsValid,
			hasRequiredChangerGateModes,
		},
	}

	return response
}
