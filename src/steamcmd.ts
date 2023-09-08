import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { gray, red } from 'colorette'

export const download = async (
  appId: string,
  query: string,
  workshopIds: string[],
  destinationPath: string
) => {
  const command = `steamcmd +login anonymous ${query} +quit`

  let move = ''
  for (const workshopId of workshopIds) {
    move += ` && move "C:/ProgramData/chocolatey/lib/steamcmd/tools/steamapps/workshop/content/${appId}/${workshopId}" ${destinationPath}`
  }

  const execPromise = promisify(exec)
  try {
    await execPromise(command + move)
    console.log(gray(`[Steam] Downloaded ${workshopIds}`))
  } catch (error: any) {
    console.log(
      red(`[Steam] Error downloading workshop item: ${error?.message}`)
    )
    throw error
  }
}
