//@ts-nocheck
import { nfa } from "delta:lib";

const machine = nfa('endsInAB')
  .alphabet('a', 'b')
  .states('q0', 'q1', 'q2')
  .start('q0')
  .accept('q2')
  .transition('q0', 'a', 'q0')
  .transition('q0', 'b', 'q0')
  .transition('q0', 'a', 'q1')
  .transition('q1', 'b', 'q2')
  .build()

export default machine
