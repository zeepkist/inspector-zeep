import { exec } from 'node:child_process'
//import { mkdir } from 'node:fs/promises'
//import { join } from 'node:path'
import { rename } from 'node:fs/promises'
import { promisify } from 'node:util'

import { gray, red } from 'colorette'

export const download = async (
  appId: string,
  query: string,
  workshopIds: string[],
  destinationPath: string
) => {
  const command = `steamcmd +login anonymous ${query} +quit`

  const execPromise = promisify(exec)
  try {
    await execPromise(command)

    for (const workshopId of workshopIds) {
      await rename(
        `C:/ProgramData/chocolatey/lib/steamcmd/tools/steamapps/workshop/content/${appId}/${workshopId}`,
        `${destinationPath}/${workshopId}`
      )
      console.log(gray(`[Steam] Moved ${workshopId}`))
    }
    console.log(gray(`[Steam] Downloaded ${workshopIds}`))
  } catch (error: any) {
    console.log(
      red(`[Steam] Error downloading workshop item: ${error?.message}`)
    )
    throw error
  }
}
