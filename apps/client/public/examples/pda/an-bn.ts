//@ts-nocheck
import { EPSILON, pda } from "delta:lib";

const machine = pda('anBn')
  .alphabet('a', 'b')
  .states('q0', 'q1', 'q2')
  .start('q0')
  .accept('q2')
  .stackAlphabet('Z', 'A')
  .initialStack('Z')
  .transition('q0', 'a', 'Z', ['A', 'Z'], 'q0')
  .transition('q0', 'a', 'A', ['A', 'A'], 'q0')
  .transition('q0', EPSILON, 'Z', ['Z'], 'q1')
  .transition('q0', EPSILON, 'A', ['A'], 'q1')
  .transition('q1', 'b', 'A', [], 'q1')
  .transition('q1', EPSILON, 'Z', ['Z'], 'q2')
  .build()

export default machine
