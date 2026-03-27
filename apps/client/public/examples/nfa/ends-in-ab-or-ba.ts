//@ts-nocheck
import { nfa, EPS } from "delta:lib";

const machine = nfa("endsInABOrBA")
  .alphabet("a", "b")
  .states("q0", "q1", "q2", "q3", "q4", "q5", "q6")
  .start("q0")
  .accept("q3", "q6")
  .transition("q0", EPS, "q1")
  .transition("q0", EPS, "q4")
  .transition("q1", "a", "q1")
  .transition("q1", "b", "q1")
  .transition("q1", "a", "q2")
  .transition("q2", "b", "q3")
  .transition("q4", "a", "q4")
  .transition("q4", "b", "q4")
  .transition("q4", "b", "q5")
  .transition("q5", "a", "q6")
  .build();

export default machine;
