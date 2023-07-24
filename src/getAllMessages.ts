import { gray } from 'colorette'
import { Collection, Message, TextBasedChannel } from 'discord.js'

type Messages =
  | Collection<string, Message<true>>
  | Collection<string, Message<false>>

async function* messagesIterator(channel: TextBasedChannel) {
  let before
  let isDone = false

  while (!isDone) {
    const messages: Messages = await channel.messages.fetch({
      limit: 100,
      before
    })
    if (messages.size > 0) {
      console.debug(gray(`[Discord] Found ${messages.size} messages`))
      before = messages.lastKey()
      yield messages
    } else {
      isDone = true
    }
  }
}

export async function* getAllMessages(channel: TextBasedChannel) {
  for await (const messages of messagesIterator(channel)) {
    for (const message of messages.values()) {
      yield message
    }
  }
}
