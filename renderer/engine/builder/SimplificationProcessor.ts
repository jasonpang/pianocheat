import { ParsedNote, PitchStep } from '../parser/interfaces'
import { Player, ScoreBuilderContext } from './interfaces'

export default class SimplificationProcessor {
  constructor(private input: Record<Player, Record<number, ParsedNote[]>>) {}

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

      if (!noteSet) {
        continue
      }

      for (let noteIdx = noteSet.length - 1; noteIdx >= 0; noteIdx--) {
        const note = noteSet[noteIdx]

        if (!note) {
          continue
        }

        note.displayPitch = { ...note.pitch }

        // if ((player as Player) === Player.LeftHand) {
        //   if (note.displayPitch.octave < 2) {
        //     note.displayPitch.octave = 2
        //   }
        // } else if ((player as Player) === Player.LeftHand) {
        //   if (note.displayPitch.octave > 6) {
        //     note.displayPitch.octave = 6
        //   }
        // }
      }
    }
  }
}
