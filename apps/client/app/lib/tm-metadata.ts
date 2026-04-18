import type { MoveDirection, TuringMachine } from '@delta/build'

export interface TMTransitionRow {
  id: string
  edgeKey: string
  edgeId: string
  fromState: string
  toState: string
  readSymbols: string[]
  writeSymbols: string[]
  directions: MoveDirection[]
}

function hashString(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export function edgeKeyForStates(fromState: string, toState: string): string {
  return `${fromState}→${toState}`
}

export function edgeIdForStates(fromState: string, toState: string): string {
  return `edge_${hashString(edgeKeyForStates(fromState, toState))}`
}

function compareArrays(a: string[], b: string[]): number {
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i += 1) {
    const left = a[i] ?? ''
    const right = b[i] ?? ''
    if (left < right)
      return -1
    if (left > right)
      return 1
  }
  return 0
}

function compareDirections(a: MoveDirection[], b: MoveDirection[]): number {
  return compareArrays(a, b)
}

export function formatReadTuple(readSymbols: string[]): string {
  return `[${readSymbols.join(', ')}]`
}

export function buildTMTransitionRows(
  tm: TuringMachine<number>,
): TMTransitionRow[] {
  const rows: Omit<TMTransitionRow, 'id' | 'edgeKey' | 'edgeId'>[] = []

  for (const [fromState, tupleMap] of tm.transitions) {
    for (const transition of tupleMap.values()) {
      rows.push({
        fromState,
        toState: transition.toState,
        readSymbols: [...(transition.readSymbols as string[])],
        writeSymbols: [...(transition.writeSymbols as string[])],
        directions: [...(transition.directions as MoveDirection[])],
      })
    }
  }

  rows.sort((a, b) => {
    if (a.fromState < b.fromState)
      return -1
    if (a.fromState > b.fromState)
      return 1
    if (a.toState < b.toState)
      return -1
    if (a.toState > b.toState)
      return 1

    const readCmp = compareArrays(a.readSymbols, b.readSymbols)
    if (readCmp !== 0)
      return readCmp

    const writeCmp = compareArrays(a.writeSymbols, b.writeSymbols)
    if (writeCmp !== 0)
      return writeCmp

    return compareDirections(a.directions, b.directions)
  })

  return rows.map((row, index) => ({
    ...row,
    edgeKey: edgeKeyForStates(row.fromState, row.toState),
    edgeId: edgeIdForStates(row.fromState, row.toState),
    id: `t${index + 1}`,
  }))
}

export function activeTupleFromTapes(tapes?: string[][]): string[] | null {
  if (!tapes || tapes.length === 0) {
    return null
  }

  return tapes.map((tape) => {
    const activeCell = tape.find(
      cell => cell.startsWith('[') && cell.endsWith(']'),
    )
    if (!activeCell) {
      return '_'
    }
    return activeCell.slice(1, -1)
  })
}

export function filterStepRelevantTMTransitions(
  rows: TMTransitionRow[],
  state: string | null,
  readTuple: string[] | null,
): TMTransitionRow[] {
  if (!state || !readTuple) {
    return []
  }

  return rows.filter((row) => {
    if (row.fromState !== state) {
      return false
    }
    if (row.readSymbols.length !== readTuple.length) {
      return false
    }
    return row.readSymbols.every(
      (symbol, index) => symbol === readTuple[index],
    )
  })
}
