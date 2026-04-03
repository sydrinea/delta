const source = `//---
// Welcome to Delta! This is the code editor. If you'd like to use
// a drag-and-drop interface, click the "canvas" tab above and
// use the "clear" button to get started building your own
// DFA or NFA!
// ---
import * as Delta from "delta:lib";
// import { dfa, q } from "delta:lib";

const machine = Delta.dfa("# of a's divisible by 2 or 3")
  .alphabet("a", "b")
  .states(...Delta.q(0, 5))
  .start("q0")
  .accept("q0", "q2", "q3", "q4")
  .increment("a")
  .all((s) => s.loop("b"))
  .build();

export default machine;`

export default source
