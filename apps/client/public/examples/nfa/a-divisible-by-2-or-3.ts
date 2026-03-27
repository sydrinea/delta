//@ts-nocheck
import { dfa, q } from "delta:lib";

const machine = dfa("# of a's divisible by 2 or 3")
  .alphabet("a", "b")
  .states(...q(0, 5))
  .start("q0")
  .accept("q0", "q2", "q3", "q4")
  .increment("a")
  .all((s) => s.loop("b"))
  .build();

export default machine;
