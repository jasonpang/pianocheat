import WebMidi, {
  InputEventNoteon,
  InputEventNoteoff,
  Output,
  InputEventControlchange
} from 'webmidi'
import { NotePress, NoteRelease, useStore } from '../../lib/store'
import { Player } from '../builder/interfaces'
import { PitchToByte, PitchToStr } from '../builder/Utils'
import { ParsedNote } from '../parser/interfaces'

if (typeof window !== 'undefined') {
  ;(window as any).WebMidi = WebMidi
}

export default class MultiVoicePlayback {
  private upcomingNotePressQueueForPlayers: Record<Player, NotePress[]> = {
    'player-computer': [],
    'player-left-hand': [],
    'player-muted': [],
    'player-right-hand': []
  }
  private upcomingNoteReleaseQueueForPlayers: Record<Player, NoteRelease[]> = {
    'player-computer': [],
    'player-left-hand': [],
    'player-muted': [],
    'player-right-hand': []
  }
  private pressedNotesForPlayers: Record<Player, Record<number, number>> = {
    'player-computer': {},
    'player-left-hand': {},
    'player-muted': {},
    'player-right-hand': {}
  }
  private output!: Output

  constructor(private score: Record<Player, Record<number, ParsedNote[]>>) {
    const output = WebMidi.outputs.filter(
      (x) =>
        x.name.toLowerCase().includes('loopbe') ||
        x.name.toLowerCase().includes('iac driver')
    )[0]

    if (!output) {
      console.log('Could not find LoopBe output.')
      return
    }

    this.output = output
  }

  public processControlChange(e: InputEventControlchange) {
    this.output.sendControlChange(e.data[0], e.value)
  }

  public processNoteOnOrOff(e: InputEventNoteon | InputEventNoteoff) {
    const player = this.getPlayerForEvent(e.note.number)

    const score =
      useStore.getState().performance?.score.performance.intermediateScore
    const cursor = useStore.getState().performance?.cursors[player]

    if (!score) {
      console.log('Score is undefined.')
      return
    }
    if (cursor == null) {
      console.log('Cursor for player', player, 'is undefined:', cursor)
      return
    }

    const noteSets = score[player]
    const noteSetTimes = Object.keys(score[player])
      .map((x) => parseFloat(x))
      .sort((a, b) => a - b)
    const noteReleaseQueue = this.upcomingNoteReleaseQueueForPlayers[player]
    const notePressQueue = this.upcomingNotePressQueueForPlayers[player]
    const pressedNotes = this.pressedNotesForPlayers[player]
    console.log({ noteSets })
    console.log({ a: noteSetTimes[cursor] })

    let cursorDecrement = 1
    let previousNoteSet =
      cursor > 0 ? noteSets[noteSetTimes[cursor - cursorDecrement]] : null
    while (
      previousNoteSet?.filter((x) => x.rest).length === previousNoteSet?.length
    ) {
      cursorDecrement += 1
      previousNoteSet =
        cursor > 0 ? noteSets[noteSetTimes[cursor - cursorDecrement]] : null

      if (Math.abs(cursorDecrement) > noteSetTimes.length) {
        break
      }
    }

    const currentNoteSet =
      cursor < noteSetTimes.length ? noteSets[noteSetTimes[cursor]] : null

    let cursorIncrement = 1
    let nextNoteSet =
      cursor < noteSetTimes.length - 1
        ? noteSets[noteSetTimes[cursor + cursorIncrement]]
        : null
    while (nextNoteSet?.filter((x) => x.rest).length === nextNoteSet?.length) {
      cursorIncrement += 1
      console.log('cursor increment from to:', cursor, cursor + cursorIncrement)
      nextNoteSet =
        cursor < noteSetTimes.length - 1
          ? noteSets[noteSetTimes[cursor + cursorIncrement]]
          : null

      if (Math.abs(cursorIncrement) > noteSetTimes.length) {
        break
      }
    }

    const isFinished = currentNoteSet === null
    const isStarting = previousNoteSet === null

    if (isFinished) {
      return
    }

    switch (e.type) {
      case 'noteon':
        {
          const pitch = e.note.number
          if (
            pressedNotes[pitch] ||
            notePressQueue.filter((x) => x.pitch === pitch).length
          ) {
            console.log(`Ignoring ${pitch} because it's already pressed.`)
            return
          }

          notePressQueue.push({
            pitch: pitch,
            velocity: e.rawVelocity
          })

          const numRequiredNotesPressed = currentNoteSet?.length

          if (!numRequiredNotesPressed) {
            console.log('numRequiredNotesPressed is undefined.')
            return
          }

          const areEnoughNotesPressed =
            notePressQueue.length >= numRequiredNotesPressed

          if (areEnoughNotesPressed) {
            for (const notePress of notePressQueue) {
              this.processChord({
                targetNotePress: notePress,
                notePresses: notePressQueue,
                previousNoteSet: previousNoteSet!,
                currentNoteSet: currentNoteSet!,
                nextNoteSet: nextNoteSet!,
                pressedNotes
              })
            }
            notePressQueue.length = 0

            for (const noteRelease of noteReleaseQueue) {
              this.processNoteOff({
                release: noteRelease,
                noteReleaseQueue: noteReleaseQueue,
                notePressQueue: notePressQueue,
                previousNoteSet: previousNoteSet!,
                currentNoteSet: currentNoteSet!,
                nextNoteSet: nextNoteSet!,
                pressedNotes
              })
            }
            noteReleaseQueue.length = 0

            useStore
              .getState()
              .update((x) => (x.performance!.cursors[player] += 1))
          }
        }
        break
      case 'noteoff':
        {
          this.processNoteOff({
            release: { pitch: e.note.number },
            noteReleaseQueue: noteReleaseQueue,
            notePressQueue: notePressQueue,
            previousNoteSet: previousNoteSet!,
            currentNoteSet: currentNoteSet!,
            nextNoteSet: nextNoteSet!,
            pressedNotes
          })
        }
        break
    }
  }

  public processNoteOff({
    release,
    notePressQueue,
    noteReleaseQueue,
    previousNoteSet,
    currentNoteSet,
    nextNoteSet,
    pressedNotes
  }: {
    release: NoteRelease
    notePressQueue: NotePress[]
    noteReleaseQueue: NoteRelease[]
    previousNoteSet: ParsedNote[]
    currentNoteSet: ParsedNote[]
    nextNoteSet: ParsedNote[]
    pressedNotes: Record<number, number>
  }) {
    const physicalPitch = release.pitch

    /* Don't release notes before they are pressed */
    if (notePressQueue.filter((x) => x.pitch == physicalPitch).length) {
      noteReleaseQueue.push({
        pitch: physicalPitch
      })
      return
    }

    const wasMappedPitchFound = !!pressedNotes[physicalPitch]

    if (!wasMappedPitchFound) {
      console.log(
        `No pitch mapping found for ${physicalPitch}, but it was a previously pressed note.`
      )
      return
    }

    const mappedPitch = pressedNotes[physicalPitch]
    if (this.output != null) {
      delete pressedNotes[physicalPitch]
      this.output.stopNote(mappedPitch, 1, {
        rawVelocity: true,
        velocity: 64
      })
    }
  }

  getPlayerForEvent(pitchByte: number) {
    return pitchByte >= 60 ? Player.RightHand : Player.LeftHand
  }

  processChord({
    targetNotePress,
    notePresses,
    previousNoteSet,
    currentNoteSet,
    nextNoteSet,
    pressedNotes
  }: {
    targetNotePress: NotePress
    notePresses: NotePress[]
    previousNoteSet: ParsedNote[]
    currentNoteSet: ParsedNote[]
    nextNoteSet: ParsedNote[]
    pressedNotes: Record<number, number>
  }) {
    // Zero-based index of which note out of the chord's notes is being processed
    const noteIndex = [...notePresses]
      .sort((a, b) => a.pitch - b.pitch)
      .findIndex((x) => x.pitch === targetNotePress.pitch)

    if (noteIndex == null || noteIndex === -1) {
      console.log('Could not find the corrected note!')
      return
    }
    const correctedNote = currentNoteSet[noteIndex]

    if (!correctedNote) {
      console.log(
        `No corrected note found in current note set ${JSON.stringify(
          currentNoteSet,
          null,
          4
        )}.`
      )
      return
    }

    if (this.output) {
      pressedNotes[targetNotePress.pitch] = PitchToByte(correctedNote.pitch)
      this.output.playNote(PitchToByte(correctedNote.pitch), 1, {
        rawVelocity: true,
        velocity: targetNotePress.velocity
      })
    }
  }
}
