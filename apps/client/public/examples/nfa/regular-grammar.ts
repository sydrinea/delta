//@ts-nocheck
import { grammar } from "delta:lib";

const machine = grammar("ends in ab")
  .terminals("a", "b")
  .nonTerminals("S", "A")
  .start("S")
  .rule("S", "a", "S")
  .rule("S", "b", "S")
  .rule("S", "a", "A")
  .rule("A", "b")
  .build();

export default machine;
