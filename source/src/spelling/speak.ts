/** Say a word aloud with the phone's own voice (works offline where the phone has one). */
export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

export function speak(text: string): void {
  if (!canSpeak()) return
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-GB'
    const voice = synth.getVoices().find((v) => v.lang === 'en-GB')
    if (voice) u.voice = voice
    u.rate = 0.85
    synth.speak(u)
  } catch {
    /* no voice available: the phonetic spelling is still on screen */
  }
}
