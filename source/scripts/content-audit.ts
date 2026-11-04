/**
 * Content audit:  npm run audit:content [-- --sample=3 --skill=maths.number.bidmas]
 *  - runs every generator at every level over many seeds and reports structural problems
 *  - prints coverage: which skills have questions, which don't
 *  - --sample=N prints N example questions per generator level so you can eyeball quality
 *  - --pack=<subject> audits just that subject's pack (src/content/<subject>/pack.ts), registered or not
 */
import { registry as fullRegistry } from '../src/content'
import { auditRegistry } from '../src/content/quality'
import { plainText } from '../src/engine/judge'
import { Registry, type SubjectPack } from '../src/engine/registry'

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const sample = Number(arg('sample') ?? 0)
const onlySkill = arg('skill')
// --pack=history audits one pack from src/content/history/pack.ts on its own, whether or not it's registered yet.
const onlyPack = arg('pack')
const registry = onlyPack
  ? new Registry([Object.values((await import(`../src/content/${onlyPack}/pack.ts`)) as Record<string, unknown>).find((v): v is SubjectPack => !!v && typeof v === 'object' && 'generators' in v && 'skills' in v)!])
  : fullRegistry

const rows = auditRegistry(registry, 200)
const grouped = new Map<string, (typeof rows)[number]>()
for (const r of rows) if (!grouped.has(`${r.generatorId}|${r.problem}`)) grouped.set(`${r.generatorId}|${r.problem}`, r)

console.log('\n== COVERAGE ==')
for (const pack of registry.packs.values()) {
  const skills = pack.skills
  const covered = skills.filter((s) => registry.hasContent(s.id))
  console.log(`${pack.name} v${pack.version}: ${covered.length}/${skills.length} skills have questions, ${pack.generators.length} generators`)
  for (const year of [...new Set(skills.map((s) => s.year))].sort()) {
    const ys = skills.filter((s) => s.year === year)
    const missing = ys.filter((s) => !registry.hasContent(s.id))
    console.log(`  Year ${year}: ${ys.length - missing.length}/${ys.length}${missing.length ? '   missing: ' + missing.map((s) => s.name).join(', ') : ''}`)
  }
}

console.log('\n== DIFFICULTY BANDS (skills whose generators do not cover levels 2-4; foundations 2-3) ==')
for (const pack of registry.packs.values()) {
  const gaps = pack.skills.flatMap((s) => {
    const gens = pack.generators.filter((g) => g.skillId === s.id)
    const missing = (s.origin === 'foundation' ? [2, 3] : [2, 3, 4]).filter((lv) => !gens.some((g) => g.levels[0] <= lv && lv <= g.levels[1]))
    return missing.length ? [`${s.name} (${s.id}): no level ${missing.join(', ')}`] : []
  })
  console.log(gaps.length ? gaps.join('\n') : 'none')
}

console.log('\n== PROBLEMS ==')
if (grouped.size === 0) console.log('none')
for (const r of grouped.values()) console.log(`${r.generatorId} L${r.level} seed ${r.seed}: ${r.problem}\n    ${plainText(r.prompt)}`)

if (sample > 0) {
  console.log('\n== SAMPLES ==')
  for (const pack of registry.packs.values()) {
    for (const g of pack.generators) {
      if (onlySkill && g.skillId !== onlySkill) continue
      for (let level = g.levels[0]; level <= g.levels[1]; level++) {
        for (let i = 0; i < sample; i++) {
          const it = registry.generateWith(g.id, level, 1000 + i * 37 + level)
          const a = it.kind === 'numeric' ? it.fields.map((f) => f.display ?? f.answer).join(' | ') : it.kind === 'expr' ? it.answer : it.kind === 'choice' ? (it.options.find((o) => o.correct)?.label ?? '') : it.kind === 'order' ? it.correctOrder.map((id) => it.items.find((x) => x.id === id)?.label).join(' < ') : it.kind === 'match' ? it.pairs.map((p) => `${p.left}=${p.right}`).join('; ') : it.kind === 'reveal' ? `[self-marked, pass ${it.passMark}/${it.checklist.length}] ${it.model}` : it.accept[0]
          console.log(`[${g.id} L${level}] ${plainText(it.prompt)}   ->  ${plainText(String(a))}`)
        }
      }
    }
  }
}
process.exit(grouped.size ? 1 : 0)
