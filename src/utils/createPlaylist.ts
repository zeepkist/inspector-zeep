  import { ZEEPKIST_THEME_NAME } from '../config/index.js'
  import { getLevel } from './index.js'

  interface PlaylistLevel {
	UID: string
	WorkshopID: number
	Name: string
	Author: string
  }

  let hasPlaylistBeenInvalidated = false

  const LEVELS = new Set<PlaylistLevel>()

  const createPlaylistName = () => {
	const name = ZEEPKIST_THEME_NAME || 'Playlist'

	return `${name} - ${LEVELS.size}`
  }

export const createPlaylist = () => {
	if (!hasPlaylistBeenInvalidated) {
	  return undefined
	}

	const playlist = {
	  name: createPlaylistName(),
	  amountOfLevels: LEVELS.size,
	  roundLength: 420,
	  shufflePlaylist: false,
	  UID: [],
	  levels: [...LEVELS]
	}

	return playlist
  }

  export const addToPlaylist = async (
	workshopPath: string,
	workshopId: string,
	invalidatePlaylist = false
  ) => {
	const level = await getLevel(workshopPath)

	if (!level) return

	if (invalidatePlaylist) {
	  hasPlaylistBeenInvalidated = true
	}

	LEVELS.add({
	  UID: level.uuid,
	  WorkshopID: Number(workshopId),
	  Name: level.name,
	  Author: level.author.name
	})
  }
