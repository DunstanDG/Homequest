/**
 * The readable font (Atkinson Hyperlegible, designed for low-vision and dyslexic readers), loaded only when someone
 * picks it. The font files are inlined into this small lazy chunk (a .js file, so the service worker precaches it
 * and it works offline); the CSS that uses it is `html.calm-font-readable` at the end of styles.css.
 */
import r400 from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2?inline'
import r700 from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2?inline'

let loaded = false

export function loadReadableFont(): void {
  if (loaded || typeof FontFace !== 'function' || !document.fonts) return
  loaded = true
  for (const [src, weight] of [[r400, '400'], [r700, '700']] as const) {
    const face = new FontFace('Atkinson Hyperlegible', `url(${src}) format('woff2')`, { weight, style: 'normal', display: 'swap' })
    document.fonts.add(face)
    void face.load().catch(() => {})
  }
}
