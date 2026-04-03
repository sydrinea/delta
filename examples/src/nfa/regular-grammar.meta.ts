import type { ExampleMeta } from '../schemas'
import endsInAbMeta from './ends-in-ab.meta'

export default {
  ...endsInAbMeta,
  label: 'Strings ending with \'ab\' (Regular Grammar)',
  type: 'nfa',
} satisfies ExampleMeta
