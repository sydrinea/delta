//@ts-nocheck
import { multitape } from "delta:lib";

const machine = multitape('binary addition', 3)
  .alphabet('0', '1', '#')
  .tape('0', '1', '#', '_')
  .blank('_')
  .states('qScan', 'qCopy', 'qRewind', 'qNoCarry', 'qCarry', 'qDone', 'qInit')
  .start('qInit')
  .accept('qDone')
  // Step 1: Start by heading right to find the first operand
  .state('qInit', s => s.on(['_', '_', '_'], ['R', 'S', 'S'], 'qScan'))
  // Step 2: Skip first operand, find the '#' separator
  .state('qScan', s => s.seek(0, ['0', '1'], '#', 'R', 'qCopy', '_', '_'))
  // Step 3: Copy the second operand to Tape 2, overwriting with blanks on Tape 1
  .state('qCopy', s =>
    s
      .on(['0', '_', '_'], ['R', 'R', 'S'], 'qCopy', ['_', '0', '_'])
      .on(['1', '_', '_'], ['R', 'R', 'S'], 'qCopy', ['_', '1', '_'])
      .on(['_', '_', '_'], ['L', 'L', 'S'], 'qRewind'))
  // Step 4: Rewind Tape 1 & Tape 2 to the ends of the operands
  .state('qRewind', s =>
    s
      .on(['_', '0', '_'], ['L', 'S', 'S'], 'qRewind')
      .on(['_', '1', '_'], ['L', 'S', 'S'], 'qRewind')
      .on([['0', '1'], ['0', '1'], '_'], ['S', 'S', 'S'], 'qNoCarry'))
  // Step 5: Add without carry (write to Tape 3)
  .state('qNoCarry', s =>
    s
      .on(['0', '0', '_'], ['L', 'L', 'L'], 'qNoCarry', ['0', '0', '0'])
      .on(['0', '1', '_'], ['L', 'L', 'L'], 'qNoCarry', ['0', '1', '1'])
      .on(['1', '0', '_'], ['L', 'L', 'L'], 'qNoCarry', ['1', '0', '1'])
      .on(['1', '1', '_'], ['L', 'L', 'L'], 'qCarry', ['1', '1', '0'])
      .on(['0', '_', '_'], ['L', 'L', 'L'], 'qNoCarry', ['0', '_', '0'])
      .on(['1', '_', '_'], ['L', 'L', 'L'], 'qNoCarry', ['1', '_', '1'])
      .on(['_', '0', '_'], ['L', 'L', 'L'], 'qNoCarry', ['_', '0', '0'])
      .on(['_', '1', '_'], ['L', 'L', 'L'], 'qNoCarry', ['_', '1', '1'])
      .on(['_', '_', '_'], ['S', 'S', 'S'], 'qDone'))
  // Step 6: Add with carry (write to Tape 3)
  .state('qCarry', s =>
    s
      .on(['0', '0', '_'], ['L', 'L', 'L'], 'qNoCarry', ['0', '0', '1'])
      .on(['0', '1', '_'], ['L', 'L', 'L'], 'qCarry', ['0', '1', '0'])
      .on(['1', '0', '_'], ['L', 'L', 'L'], 'qCarry', ['1', '0', '0'])
      .on(['1', '1', '_'], ['L', 'L', 'L'], 'qCarry', ['1', '1', '1'])
      .on(['0', '_', '_'], ['L', 'L', 'L'], 'qNoCarry', ['0', '_', '1'])
      .on(['1', '_', '_'], ['L', 'L', 'L'], 'qCarry', ['1', '_', '0'])
      .on(['_', '0', '_'], ['L', 'L', 'L'], 'qNoCarry', ['_', '0', '1'])
      .on(['_', '1', '_'], ['L', 'L', 'L'], 'qCarry', ['_', '1', '0'])
      .on(['_', '_', '_'], ['S', 'S', 'S'], 'qDone', ['_', '_', '1']))
  .build()

export default machine
