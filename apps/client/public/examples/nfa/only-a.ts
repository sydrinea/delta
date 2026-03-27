//@ts-nocheck
import { dfa } from "delta:lib";

const machine = dfa("onlyAs")
  .alphabet("a", "b")
  .states("q0", "q1")
  .start("q0")
  .accept("q0")
  .transition("q0", "a", "q0")
  .transition("q0", "b", "q1")
  .transition("q1", "a", "q1")
  .transition("q1", "b", "q1")
  .build();

export default machine;
