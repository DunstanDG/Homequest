// Builds a single-file page (no service worker) for hosts that publish one HTML fragment:
//   npx vite build --mode inline --outDir dist-inline && node scripts/inline-build.mjs out.html
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = 'dist-inline/assets'
const files = readdirSync(dir)
const entry = files.find((f) => /^index-.*\.js$/.test(f)) ?? files.find((f) => f.endsWith('.js'))
const js = readFileSync(`${dir}/${entry}`, 'utf8').replace(/<\/script/gi, '<\\/script')
const css = readFileSync(`${dir}/${files.find((f) => f.endsWith('.css'))}`, 'utf8')
const page = `<title>StudyQuest</title>
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
writeFileSync(process.argv[2] ?? 'studyquest-inline.html', page)
console.log('wrote', process.argv[2] ?? 'studyquest-inline.html', (page.length / 1024).toFixed(0) + ' KB')
