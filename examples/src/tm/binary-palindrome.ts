import { multitape } from '@delta/build'

const machine = multitape('binary palindrome', 1)
  .alphabet('0', '1')
  .tape('X', 'Y', '_')
  .blank('_')
  .states('q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8')
  .start('q0')
  .accept('q6')
  // Step 1: Start by moving right, skipping the initial blank
  .state('q0', s => s.on(['_'], ['R'], 'q1'))
  // Step 2: Read the leftmost unmarked character and mark it (X for 0, Y for 1)
  .state(
    'q1',
    s =>
      s
        .on(['0'], ['R'], 'q2', ['X'])
        .on(['1'], ['R'], 'q7', ['Y'])
        .on([['X', 'Y']], ['R'], 'q5') // Hit marks: even length palindrome center reached
        .on(['_'], ['R'], 'q6'), // Hit blank: empty string / done
  )
  // Step 3a: 0-Branch - Scan right to the end of unmarked characters
  .state(
    'q2',
    s => s.on([['0', '1']], ['R'], 'q2').on([['_', 'X', 'Y']], ['L'], 'q3'), // Reached boundary, step left
  )
  // Step 4a: 0-Branch - Verify the rightmost unmarked character is a '0'
  .state(
    'q3',
    s =>
      s
        .on([['X', 'Y']], ['L'], 'q3') // Rewind past marked characters
        .on(['0'], ['L'], 'q4', ['X']) // Match found! Mark it and head back
        .on(['_'], ['R'], 'q5'), // No match found, hit left bound (odd length middle)
  )
  // Step 3b: 1-Branch - Scan right to the end of unmarked characters
  .state(
    'q7',
    s => s.on([['0', '1']], ['R'], 'q7').on([['_', 'X', 'Y']], ['L'], 'q8'), // Reached boundary, step left
  )
  // Step 4b: 1-Branch - Verify the rightmost unmarked character is a '1'
  .state(
    'q8',
    s =>
      s
        .on([['X', 'Y']], ['L'], 'q8') // Rewind past marked characters
        .on(['1'], ['L'], 'q4', ['Y']) // Match found! Mark it and head back
        .on(['_'], ['R'], 'q5'), // No match found, hit left bound (odd length middle)
  )
  // Step 5: Rewind left back to the leftmost boundary
  .state(
    'q4',
    s =>
      s
        .on([['0', '1']], ['L'], 'q4') // Rewind unmarked
        .on([['X', 'Y', '_']], ['R'], 'q1'), // Hit left boundary, step right to restart loop
  )
  // Step 6: Verify remaining tape is fully marked (cleanup/accept phase)
  .state(
    'q5',
    s => s.on([['X', 'Y']], ['R'], 'q5').on(['_'], ['R'], 'q6'), // Everything is matched, accept!
  )
  .build()

export default machine
