//@ts-nocheck
import { tm } from "delta:lib";

const machine = tm('binary numbers divisible by 3')
  .alphabet('0', '1')
  .tape('0', '1', '_')
  .blank('_')
  .states('qInit', 'q0', 'q1', 'q2', 'qAccept')
  .start('qInit')
  .accept('qAccept')
  // Move into the machine
  .state('qInit', s => s.on('_', 'R', 'q0'))
  // State q0: current value mod 3 == 0
  .state('q0', s =>
    s.on('0', 'R', 'q0').on('1', 'R', 'q1').on('_', 'S', 'qAccept'))
  // State q1: current value mod 3 == 1
  .state('q1', s => s.on('0', 'R', 'q2').on('1', 'R', 'q0'))
  // State q2: current value mod 3 == 2
  .state('q2', s => s.on('0', 'R', 'q1').on('1', 'R', 'q2'))
  .build()

export default machine
