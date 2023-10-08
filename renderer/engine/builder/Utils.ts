import { defaultCipherList } from 'constants'
import { Pitch } from '../parser/interfaces'
import { PlayerMapping } from './interfaces'

export function ToPitch(s: string): number {
  const OCTAVE_SEMITONES: number = 12
  const C0_VALUE: number = 12 /* MIDI defines C0 as 12 */
  const octave: number = parseFloat(s[s.length - 1])

  const valueForOctave: number = C0_VALUE + octave * OCTAVE_SEMITONES

  let stepSemitone: number
  switch (s[0]) {
    case 'C':
      stepSemitone = 0
      break
    case 'D':
      stepSemitone = 2
      break
    case 'E':
      stepSemitone = 4
      break
    case 'F':
      stepSemitone = 5
      break
    case 'G':
      stepSemitone = 7
      break
    case 'A':
      stepSemitone = 9
      break
    case 'B':
      stepSemitone = 11
      break
    default:
      throw new Error(`Received a string pitch to parse with a step of ${s[0]}`)
  }

  const numberOfSharps = Array.from(s).filter((x) => x == '#').length
  const numberOfFlats = Array.from(s).filter((x) => x == 'b').length

  const alterSemitoneForSharps = numberOfSharps
  const alterSemitoneForFlats = -numberOfFlats

  return (
    valueForOctave +
    stepSemitone +
    alterSemitoneForSharps +
    alterSemitoneForFlats
  )
}

export function PitchToStr(pitch: Pitch): string {
  const { step, alter, octave } = pitch
  return `${step}${alter === -1 ? 'b' : alter === 1 ? '#' : ''}${octave}`
}

export function PitchToByte(pitch: Pitch): number {
  if (!pitch || !pitch.step) {
    throw new Error('No pitch or step found, cannot convert.')
  }

  const { octave, alter, step } = pitch

  const OCTAVE_SEMITONES: number = 12
  const C0_VALUE: number = 12 /* MIDI defines C0 as 12 */

  const valueForOctave: number = C0_VALUE + octave * OCTAVE_SEMITONES

  let stepSemitone: number
  switch (step) {
    case 'C':
      stepSemitone = 0
      break
    case 'D':
      stepSemitone = 2
      break
    case 'E':
      stepSemitone = 4
      break
    case 'F':
      stepSemitone = 5
      break
    case 'G':
      stepSemitone = 7
      break
    case 'A':
      stepSemitone = 9
      break
    case 'B':
      stepSemitone = 11
      break
    default:
      throw new Error(`Received a pitch with a step of ${step}.`)
  }

  /* alter is a decimal, but microtonal alters aren't supported in a piano */
  const alterSemitone: number =
    alter != null && alter !== 0 ? Math.floor(alter) : 0

  return valueForOctave + stepSemitone + alterSemitone
}

export function getKeyedPlayerMappings(
  playerMappings: PlayerMapping[]
): Record<string, PlayerMapping> {
  const record: Record<string, PlayerMapping> = {}
  for (const entry of playerMappings) {
    record[`part/${entry.part.number}/staff/${entry.staff}`] = entry
    record[`part/${entry.part.name}/staff/${entry.staff}`] = entry
  }
  return record
}
