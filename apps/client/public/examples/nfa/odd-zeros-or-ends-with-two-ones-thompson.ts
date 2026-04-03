//@ts-nocheck
import { thompson } from "delta:lib";

const zeroOrOneStar = thompson('0|1')
  .char('0')
  .char('1')
  .union()
  .star()
  .build()

const endsWith11 = thompson('Σ*11')
  .machine(zeroOrOneStar)
  .char('1')
  .char('1')
  .concat()
  .concat()
  .build()

const oddZeros = thompson('0(00)*')
  .char('0')
  .char('0')
  .concat()
  .star()
  .char('0')
  .concat()
  .build()

const machine = thompson('0(00)* U Σ*11')
  .machine(endsWith11)
  .machine(oddZeros)
  .union()
  .build()

export default machine
