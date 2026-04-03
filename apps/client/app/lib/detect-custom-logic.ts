import { parse } from '@babel/parser'

const TARGET_METHODS = new Set([
  // StateProxy & NFABuilder Advanced Methods
  'loop',
  'to',
  'done',
  'state',
  'batch',
  'all',
  'increment',
  'bounce',
  'plus',
  'star',

  // ThompsonBuilder & Top-Level Utility Functions
  'thompson',
  'dfa',
  'char',
  'machine',
  'eps',
  'union',
  'concat',
  'q',
  'convertToDFA',
  'epsilon',
  'empty',
])

export function containsCustomLogicOrComments(code: string): boolean {
  if (!code.trim())
    return false

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    if (ast.comments && ast.comments.length > 0) {
      return true
    }

    let found = false

    function walk(node: any) {
      if (found || !node || typeof node !== 'object')
        return

      if (node.type === 'CallExpression') {
        const callee = node.callee

        if (callee.type === 'Identifier' && TARGET_METHODS.has(callee.name)) {
          found = true
          return
        }

        if (
          callee.type === 'MemberExpression'
          && callee.property.type === 'Identifier'
          && TARGET_METHODS.has(callee.property.name)
        ) {
          found = true
          return
        }
      }

      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(walk)
        }
        else if (typeof node[key] === 'object') {
          walk(node[key])
        }
      }
    }

    walk(ast.program)
    return found
  }
  catch {
    return false
  }
}
