import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { gray, red } from 'colorette'

const appId = '1440670'

export const download = async (workshopId: string, destinationPath: string) => {
  const command = `steamcmd +login anonymous +workshop_download_item ${appId} ${workshopId} +quit && move "C:/ProgramData/chocolatey/lib/steamcmd/tools/steamapps/workshop/content/${appId}/${workshopId}" ${destinationPath}`

  const execPromise = promisify(exec)
  try {
    await execPromise(command)
    console.log(gray(`[SteamCMD] Downloaded workshop item ${workshopId}`))
  } catch (error: any) {
    console.log(
      red(`[SteamCMD] Error downloading workshop item: ${error?.message}`)
    )
    throw error
  }
}
