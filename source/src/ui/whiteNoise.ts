/**
 * Looping white noise for a running sleep timer. Generated procedurally with the Web Audio API (no audio file, no
 * dependency): a short buffer of random samples, played back looped through an AudioBufferSourceNode.
 *
 * Web Audio cannot start without a user gesture, so this must only ever be called from an event handler (the parent
 * tapping a play/mute control), never from a mount effect.
 */
export interface WhiteNoiseHandle {
  stop: () => void
}

export function startWhiteNoise(volume = 0.05): WhiteNoiseHandle | undefined {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return undefined
    const ctx = new Ctor()
    const seconds = 2
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = ctx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    let stopped = false
    return {
      stop: () => {
        if (stopped) return
        stopped = true
        try {
          source.stop()
          source.disconnect()
          gain.disconnect()
          void ctx.close()
        } catch {
          /* already stopped: fine */
        }
      },
    }
  } catch {
    return undefined
  }
}
