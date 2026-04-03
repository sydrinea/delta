import { thompson } from '@delta/build'
import { convertToDFA } from '@delta/transform'

const zeroOne = thompson('01*').char('0').char('1').star().concat().build()

const machine = thompson('1*(01*01*01*)*')
  .char('1')
  .star()
  .machine(zeroOne)
  .machine(zeroOne)
  .machine(zeroOne)
  .concat()
  .concat()
  .star()
  .concat()
  .build()

const deterministic = convertToDFA(machine, {
  name: '1*(01*01*01*)* (as DFA)',
  preserveNames: false,
})

export default deterministic
