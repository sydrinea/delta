const source = `import * as Delta from "delta:lib";

const machine = Delta.pda("aⁿbⁿ")
  .alphabet("a", "b")
  .stackAlphabet("A", "Z")
  .initialStack("Z")
  .states("q0", "q1", "q2")
  .start("q0")
  .accept("q2")
  // Accept empty string (n = 0)
  .transition("q0", "ε", "Z", ["Z"], "q2")
  // Read a's: push A onto the stack
  .transition("q0", "a", "ε", ["A"], "q0")
  // Start reading b's: pop one A per b
  .transition("q0", "b", "A", [], "q1")
  .transition("q1", "b", "A", [], "q1")
  // Accept when all A's are popped
  .transition("q1", "ε", "Z", ["Z"], "q2")
  .build();

export default machine;`

export default source
