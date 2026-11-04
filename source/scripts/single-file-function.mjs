// Builds the one-file version of an Edge Function for pasting into the Supabase dashboard editor (which can't
// bundle ../_shared/). Usage: node scripts/single-file-function.mjs log-care breakdown > out.ts
//   node scripts/single-file-function.mjs <function> <shared-file-name-without-ext> > <function>-function-index.ts
import { readFileSync } from 'node:fs'

const [fn, shared] = process.argv.slice(2)
if (!fn || !shared) {
  console.error('usage: node scripts/single-file-function.mjs <function> <shared>')
  process.exit(1)
}
const dir = new URL('../supabase/functions/', import.meta.url)
const index = readFileSync(new URL(`${fn}/index.ts`, dir), 'utf8')
const lib = readFileSync(new URL(`_shared/${shared}.ts`, dir), 'utf8')
const importRe = new RegExp(`^import[^;]*?from '\\.\\./_shared/${shared}\\.ts'\\n`, 'ms')
if (!importRe.test(index)) {
  console.error(`index.ts of ${fn} does not import _shared/${shared}.ts`)
  process.exit(1)
}
const header = index.slice(0, index.search(importRe))
const body = index.replace(importRe, '').slice(header.length)
process.stdout.write(`${header}// ---- shared code (supabase/functions/_shared/${shared}.ts), inlined for the dashboard editor ----\n${lib.replace(/^export /gm, '')}\n// ---- the function ----\n${body}`)
