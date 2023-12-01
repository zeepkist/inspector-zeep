import { Client, GatewayIntentBits } from 'discord.js'

export const createClient = () => {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
  })

  client.login(process.env.DISCORD_TOKEN)

  return client
}
