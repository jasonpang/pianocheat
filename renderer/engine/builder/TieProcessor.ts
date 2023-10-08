import {
  Attributes,
  Backup,
  Forward,
  Measure,
  ParsedNote,
  ParsedScore,
  Part,
  PitchStep
} from '../parser/interfaces'
import {
  LogLevel,
  Player,
  PlayerMapping,
  ScoreBuilderContext
} from './interfaces'
import { getKeyedPlayerMappings } from './Utils'
import equal from 'fast-deep-equal'

export default class TieProcessor {
  private previousNote?: ParsedNote

  constructor(
    private context: ScoreBuilderContext,
    private input: Record<Player, Record<number, ParsedNote[]>>
  ) {}

  public process(): Record<Player, Record<number, ParsedNote[]>> {
    for (const [player, playerNotes] of Object.entries(this.input)) {
      this.processPlayerNotes(player as Player, playerNotes)
    }

    return this.input
  }

  private processPlayerNotes(
    player: Player,
    playerNotes: Record<number, ParsedNote[]>
  ) {
    const noteSetTimes = Object.keys(playerNotes)
      .map((x) => parseFloat(x))
      .sort((a, b) => a - b)

    for (
      let noteSetTimeIdx = noteSetTimes.length - 1;
      noteSetTimeIdx >= 0;
      noteSetTimeIdx--
    ) {
      const noteSetTime = noteSetTimes[noteSetTimeIdx]
      const noteSet = playerNotes[noteSetTime]

      for (let noteIdx = noteSet.length - 1; noteIdx >= 0; noteIdx--) {
        const note = noteSet[noteIdx]

        if (!Array.isArray(note.notations) || !note.notations.length) {
          continue
        }

        if (
          note.notations.filter((x) => x.tied === 'continue').length ||
          note.notations.filter((x) => x.tied === 'stop').length
        ) {
          const deletedNote = { ...noteSet[noteIdx] }
          delete noteSet[noteIdx]

          for (
            let backfillNoteSetTimeIdx = noteSetTimeIdx - 1;
            backfillNoteSetTimeIdx >= noteSetTimeIdx - 15 &&
            backfillNoteSetTimeIdx >= 0;
            backfillNoteSetTimeIdx--
          ) {
            const backfillNoteSetTime = noteSetTimes[backfillNoteSetTimeIdx]

            const prevNoteSet = playerNotes[backfillNoteSetTime]
            if (prevNoteSet) {
              const previousTiedNote = prevNoteSet.filter(
                (x) =>
                  equal(x.pitch, deletedNote.pitch) &&
                  x.notations?.length &&
                  (x.notations.filter((x) => x.tied === 'start').length ||
                    x.notations.filter((x) => x.tied === 'continue').length ||
                    x.notations.filter((x) => x.tied === 'stop').length +
                      x.notations.filter((x) => x.tied === 'start').length ===
                      2)
              )[0]

              if (previousTiedNote) {
                previousTiedNote.duration += deletedNote.duration
                break
              }
            }
          }
        }
      }
    }

    const updatedNoteSetTimes = noteSetTimes
    for (
      let noteSetTimeIdx = updatedNoteSetTimes.length - 1;
      noteSetTimeIdx >= 0;
      noteSetTimeIdx--
    ) {
      const noteSetTime = updatedNoteSetTimes[noteSetTimeIdx]
      // Delete partially empty notesets after tied transformations
      playerNotes[noteSetTime] = playerNotes[noteSetTime].filter(Boolean)
      const noteSet = playerNotes[noteSetTime]

      // if (!Object.values(noteSet).length) {
      //   // Delete empty notesets after tied transformations
      //   delete playerNotes[noteSetTime]
      // }
    }
  }
}
