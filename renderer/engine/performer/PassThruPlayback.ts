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

export default class PassThruPlayback {
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
  private pressedNotesForPlayers: Record<Player, Record<number, number[]>> = {
    'player-computer': {},
    'player-left-hand': {},
    'player-muted': {},
    'player-right-hand': {}
  }
  private output!: Output

  constructor(private score: Record<Player, Record<number, ParsedNote[]>>) {
    const output = WebMidi.outputs.filter((x) =>
      x.name.toLowerCase().includes('loopbe')
    )[0]

    if (!output) {
      console.log('Could not find LoopBe output.')
      return
    }

    this.output = output
  }

  public processControlChange(e: InputEventControlchange) {
    if (e.data[1] === 64) {
      this.output.sendControlChange(e.data[1], 127 - e.value, 1)
    }
  }

  public processNoteOnOrOff(e: InputEventNoteon | InputEventNoteoff) {
    const player = this.getPlayerForEvent(e.note.number)

    const score = useStore.getState().performance?.score.performance
      .intermediateScore
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
          this.processChord({
            targetNotePress: {
              pitch,
              velocity: e.rawVelocity
            },
            notePresses: notePressQueue,
            previousNoteSet: previousNoteSet!,
            currentNoteSet: currentNoteSet!,
            nextNoteSet: nextNoteSet!,
            pressedNotes
          })

          useStore
            .getState()
            .update((x) => (x.performance!.cursors[player] += cursorIncrement))
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
    pressedNotes: Record<number, number[]>
  }) {
    const physicalPitch = release.pitch

    const wasMappedPitchesFound = !!pressedNotes[physicalPitch]

    if (!wasMappedPitchesFound) {
      console.log(
        `${physicalPitch} was physically pressed and should correspond to the virtual playing of a notated note or chord, but the key press was not found to be linked to any virtually pressed notes.`
      )
      return
    }

    const mappedPitches = pressedNotes[physicalPitch]
    if (this.output != null) {
      delete pressedNotes[physicalPitch]
      for (const mappedPitch of mappedPitches) {
        this.output.stopNote(mappedPitch, 1, {
          rawVelocity: true,
          velocity: 64
        })
      }
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
    pressedNotes: Record<number, number[]>
  }) {
    for (const element of currentNoteSet) {
      if (!element) {
        continue
      }
      if (this.output) {
        if (!pressedNotes[targetNotePress.pitch]) {
          pressedNotes[targetNotePress.pitch] = []
        }
        pressedNotes[targetNotePress.pitch].push(PitchToByte(element.pitch))

        this.output.playNote(PitchToByte(element.pitch), 1, {
          rawVelocity: true,
          velocity: targetNotePress.velocity
        })
      }
    }
  }
}
