import test from 'ava'

import {
  validateBlockLimit,
  validateMaxTime,
  validateMinTime
} from './checkLevelIsValid.js'
import {
  BLOCK_LIMIT,
  MAXIMUM_TIME,
  MINIMUM_TIME
} from './config/requirements.js'

const levelName = 'test'

test('allows block count under limit', t => {
  t.is(validateBlockLimit(levelName, BLOCK_LIMIT - 1), true)
})

test('allows block count at limit', t => {
  t.is(validateBlockLimit(levelName, BLOCK_LIMIT), true)
})

test('does not allow block count over limit', t => {
  t.is(validateBlockLimit(levelName, BLOCK_LIMIT + 1), false)
})

test('allows time over minimum', t => {
  t.is(validateMinTime(levelName, MINIMUM_TIME + 1), true)
})

test('allows time at minimum', t => {
  t.is(validateMinTime(levelName, MINIMUM_TIME), true)
})

test('does not allow time under minimum', t => {
  t.is(validateMinTime(levelName, MINIMUM_TIME - 1), false)
})

test('allows time under maximum', t => {
  t.is(validateMaxTime(levelName, MAXIMUM_TIME - 1), true)
})

test('allows time at maximum', t => {
  t.is(validateMaxTime(levelName, MAXIMUM_TIME), true)
})

test('does not allow time over maximum', t => {
  t.is(validateMaxTime(levelName, MAXIMUM_TIME + 1), false)
})
