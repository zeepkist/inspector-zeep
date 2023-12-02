import { Client, GatewayIntentBits } from 'discord.js'

import { DISCORD_TOKEN } from './config/constants.js'

export const createClient = () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
  })

  client.login(DISCORD_TOKEN)

  return client
}
