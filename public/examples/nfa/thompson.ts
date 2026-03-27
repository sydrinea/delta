//@ts-nocheck
import { thompson, convertToDFA } from "delta:lib";

const zeroOne = thompson("01*").char("0").char("1").star().concat().build();

const nfa = thompson("1*(01*01*01*)*")
  .char("1")
  .star()
  .machine(zeroOne)
  .machine(zeroOne)
  .machine(zeroOne)
  .concat()
  .concat()
  .star()
  .concat()
  .build();

const dfa = convertToDFA(nfa, {
  name: "1*(01*01*01*)* (as DFA)",
  preserveNames: false,
});

export default dfa;
// export default nfa;
