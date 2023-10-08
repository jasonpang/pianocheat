import {
  Attributes,
  Backup,
  Forward,
  Measure,
  ParsedNote,
  ParsedScore,
  Part
} from '../parser/interfaces'
import { NOTE_MARGIN } from '../../vars'
import {
  LogLevel,
  Player,
  PlayerMapping,
  ScoreBuilderContext
} from './interfaces'
import { getKeyedPlayerMappings } from './Utils'

export default class PlayerPartitionProcessor {
  private clock: number = 0
  private notesForPlayerAtTime: Record<
    Player,
    Record<number, ParsedNote[]>
  > = {} as Record<Player, Record<number, ParsedNote[]>>
  private keyedPlayerMappings: Record<string, PlayerMapping>
  private previousNote?: ParsedNote
  private attributeDivisions: number = 1
  private currentClef = 'G'
  private currentBeats: number
  private currentBeatType: number

  constructor(
    private context: ScoreBuilderContext,
    private input: ParsedScore,
    playerMappings: PlayerMapping[]
  ) {
    this.keyedPlayerMappings = getKeyedPlayerMappings(playerMappings)
  }

  public process(): Record<Player, Record<number, ParsedNote[]>> {
    for (let partIdx = 0; partIdx < this.input.parts.length; partIdx++) {
      const part = this.input.parts[partIdx]
      // Reset the clock after each part
      this.clock = 0

      for (
        let measureIdx = 0;
        measureIdx < part.measures.length;
        measureIdx++
      ) {
        const measure = part.measures[measureIdx]
        this.processMeasure(measure, measureIdx, partIdx, part)
      }
    }

    return this.notesForPlayerAtTime
  }

  private getPlayerForPartAndStaff(
    part: Part,
    partIdx: number,
    staffIdx: number
  ): Player {
    if (staffIdx === 0) {
      return Player.RightHand
    } else if (staffIdx === 1) {
      return Player.LeftHand
    } else {
      console.log('No current clef.')
      return null
    }
  }

  private setAttributes(entry: Attributes) {
    if (entry.divisions != null) {
      this.attributeDivisions = entry.divisions
    }
    if (entry.time) {
      this.currentBeats = entry.time.beats
      this.currentBeatType = entry.time.beatType
    }
  }

  private normalizeDuration(entry: Backup | Forward | ParsedNote) {
    if (this.attributeDivisions && entry.duration) {
      entry.duration =
        (entry.duration / this.attributeDivisions) *
        ((3 * this.currentBeatType) / this.currentBeats) *
        NOTE_MARGIN
    }
  }

  private processMeasure(
    measure: Measure,
    measureIdx: number,
    partIdx: number,
    part: Part
  ) {
    for (const entry of measure.children) {
      if (entry.kind !== 'attributes') {
        this.normalizeDuration(entry)
      }

      switch (entry.kind) {
        case 'attributes':
          this.setAttributes(entry)
          break
        case 'backup':
          this.rewindClock(entry.duration)
          break
        case 'forward':
          this.advanceClock(entry.duration)
          break
        case 'note':
          try {
            this.processNote(entry, partIdx, measureIdx, part)
          } catch (e) {
            console.error('Caught error:', e)
          }
          break
      }
    }
  }

  private advanceClock(duration: number): void {
    this.clock += duration
  }

  private rewindClock(duration: number): void {
    this.clock -= duration
  }

  private onBeforeAddNote({
    prevNote,
    note,
    measureIdx
  }: {
    prevNote?: ParsedNote
    note: ParsedNote
    measureIdx: number
  }) {
    if (note.staff == null) {
      note.staff = 1
    }

    if (note.grace) {
      /**
       * Let grace notes have a duration of 1.
       */
      note.duration = 0
    }

    note.measure = measureIdx

    const {
      shouldRewindLastAppliedDuration,
      shouldForwardLastUnappliedDuration
    } = this.getClockLogic({ prevNote, note })

    if (shouldRewindLastAppliedDuration && prevNote) {
      this.rewindClock(prevNote.duration)
    }

    if (shouldForwardLastUnappliedDuration && prevNote) {
      this.advanceClock(prevNote.duration)
    }
  }

  private onAddNote({
    note,
    partIdx,
    part
  }: {
    note: ParsedNote
    partIdx: number
    part: Part
  }) {
    if (note.cue) {
      return
    }

    const player = this.getPlayerForPartAndStaff(part, partIdx, note.staff - 1)
    if (!player) {
      // this.context.logs.push({
      //   message: `Note did not map to a player. Part index was ${partIdx}, staff was ${
      //     note.staff - 1
      //   }. ${JSON.stringify(note)}`,
      //   severity: LogLevel.Warning
      // })
    }

    if (!this.notesForPlayerAtTime[player]) {
      this.notesForPlayerAtTime[player] = {}
    }
    if (!this.notesForPlayerAtTime[player][this.clock]) {
      this.notesForPlayerAtTime[player][this.clock] = []
    }

    const notes = this.notesForPlayerAtTime[player][this.clock]

    // Do not add the same note twice, if another part already has the same note
    const identicalExistingNote = notes.find(
      (x) =>
        x.pitch &&
        note.pitch &&
        x.pitch.step === note.pitch.step &&
        x.pitch.octave === note.pitch.octave &&
        x.pitch.alter === note.pitch.alter
    )

    if (!identicalExistingNote) {
      notes.push(note)
    }
  }

  private onAfterAddNote({
    prevNote,
    note
  }: {
    prevNote?: ParsedNote
    note: ParsedNote
  }) {
    const { shouldAdvanceClock } = this.getClockLogic({ prevNote, note })

    if (shouldAdvanceClock) {
      this.advanceClock(note.duration)
    }
  }

  private getClockLogic({
    prevNote,
    note
  }: {
    prevNote?: ParsedNote
    note: ParsedNote
  }) {
    const isStartingChord = !!note.chord && !prevNote?.chord
    const wasChordEnded = !!prevNote?.chord && !note.chord
    const shouldRewindLastAppliedDuration = isStartingChord
    const shouldForwardLastUnappliedDuration = wasChordEnded
    const shouldAdvanceClock = !note.chord

    return {
      shouldRewindLastAppliedDuration,
      shouldForwardLastUnappliedDuration,
      shouldAdvanceClock
    }
  }

  private processNote(
    note: ParsedNote,
    partIdx: number,
    measureIdx: number,
    part: Part
  ) {
    const prevNote = this.previousNote
    this.previousNote = note

    this.onBeforeAddNote({ prevNote, note, measureIdx })
    this.onAddNote({ note, partIdx, part })
    this.onAfterAddNote({ prevNote, note })
  }
}
