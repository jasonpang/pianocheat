const SOUNDFONT =
  typeof window !== 'undefined'
    ? (window as any)._tone_0000_FluidR3_GM_sf2_file
    : null

export const audioContext =
  typeof window !== 'undefined' ? new window.AudioContext() : null

export const player =
  typeof window !== 'undefined'
    ? new (window as any).WebAudioFontPlayer()
    : null

if (typeof window !== 'undefined') {
  player.adjustPreset(audioContext, SOUNDFONT)
}

export function play({
  pitch,
  time,
  speed,
  duration
}: {
  pitch: number
  time: number
  speed: number
  duration: number
}) {
  if (typeof window === 'undefined') {
    return
  }

  player.queueWaveTable(
    audioContext,
    audioContext?.destination,
    SOUNDFONT,
    (audioContext as any)?.currentTime + time / speed,
    pitch,
    duration / speed,
    0.2
  )
}

export function stop() {
  if (typeof window === 'undefined') {
    return
  }

  player.cancelQueue(audioContext)
}
