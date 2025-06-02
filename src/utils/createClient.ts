import { Client, GatewayIntentBits } from 'discord.js'

import { DISCORD_TOKEN } from '../config/index.js'

export const createClient = () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
  })

  client.login(DISCORD_TOKEN)

  return client
}
