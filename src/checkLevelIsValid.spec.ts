import test from 'ava'

import { validateBlockLimit } from './checkLevelIsValid.js'

test('validateBlockLimit', t => {
  t.is(validateBlockLimit(0), true)
})
