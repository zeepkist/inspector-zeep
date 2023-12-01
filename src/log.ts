import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'

import { gray, red, yellow } from 'colorette'

type InfoScope = 'info' | ImportMeta
type WarnScope = 'warn' | ImportMeta
type ErrorScope = 'error' | ImportMeta

const addDecoration = (string: string) => `➤ ${string} »`

const createKey = (key: string | ImportMeta) => {
  if (typeof key === 'string') return addDecoration(key.toUpperCase())

  return addDecoration(basename(fileURLToPath(key.url), '.ts'))
}

export const info = (
  message: string,
  scope = 'info' as InfoScope,
  isMuted = false
) => {
  const key = gray(createKey(scope))

  console.info(`${key} ${isMuted ? gray(message) : message}`)
}

export const warn = (message: string, scope = 'warn' as WarnScope) => {
  const key = yellow(createKey(scope))

  console.warn(`${key} ${message}`)
}

export const error = (message: string, scope = 'error' as ErrorScope) => {
  const key = red(createKey(scope))

  console.error(`${key} ${message}`)
}
