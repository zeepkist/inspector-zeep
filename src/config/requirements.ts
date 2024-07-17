export const BLOCK_LIMIT = 4000 // 4000
export const MINIMUM_TIME = 30 // seconds
export const MAXIMUM_TIME = 75 // seconds
export const MINIMUM_CHECKPOINTS = 2
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const MAXIMUM_WIDTH: number = 0 // x 1x1 blocks wide
export const START_FINISH_PROXIMITY: number = 0 // 5 blocks apart (16 * 5)
/*
export const FIXED_CHECKPOINTS = [
  '1615,-32,8,112,0,0,0,0.999,0.999,0.999',
  '1278,8,80,64,0,90,0,1,1,1',
  '1276,32,48,192,0,0,0,1,1,1',
  '1615,80,48,96,0,0,0,0.999,0.999,0.999'
]
*/
export const FIXED_CHECKPOINTS = []
export const CHANGER_GATE_MODES_REQUIRED = new Set([
  //'Invert Steering',
  //'Invert Arms Up Braking',
  'Offroad Wheels',
  //'Paraglider',
  //'Soap Wheels'
])
