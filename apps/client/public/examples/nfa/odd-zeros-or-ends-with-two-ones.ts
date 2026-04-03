//@ts-nocheck
import { EPS, nfa } from "delta:lib";

const machine = nfa('0(00)* union Σ*11')
  .alphabet('0', '1')
  .states('q0', 'Oven', 'Odd', 'trap', 'junk', 'solo', 'aces')
  .start('q0')
  .accept('Odd', 'aces')
  .transition('q0', EPS, 'Oven')
  .transition('q0', EPS, 'junk')
  .bounce('Oven', '0', 'Odd')
  .bounce('junk', '1', 'solo', '0')
  .plus('solo', '1', 'aces')
  .plus('Odd', '1', 'trap')
  .batch(
    s => ['trap', 'junk'].includes(s),
    s => s.loop('0'),
  )
  .transition('aces', '0', 'junk')
  .transition('Oven', '1', 'trap')
  .build()

export default machine
