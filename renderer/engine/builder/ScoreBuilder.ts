import { Measure, ParsedNote, ParsedScore } from '../parser/interfaces'
import {
  BuildingNote,
  CachedMeasureInfo,
  CachedNoteSetInfo,
  MeasureBoundary,
  Performance,
  PlayableScore,
  Player,
  PlayerMapping,
  ScoreBuilderContext
} from './interfaces'
import PlayerPartitionProcessor from './PlayerPartitionProcessor'
import fs from 'fs'
import TieProcessor from './TieProcessor'
import EmptyNoteSetsProcessor from './EmptyNoteSetsProcessor'
import { PitchToByte, ToPitch } from './Utils'
import SimplificationProcessor from './SimplificationProcessor'
import { Notes } from '@material-ui/icons'
import freeze from 'simple-deep-freeze'

export default class ScoreBuilder {
  calculateScoreLengthInDivisionUnits(
    intermediateScore: Record<Player, Record<number, ParsedNote[]>>
  ): number {
    let offsetOfHighestDurationNote = 0
    let highestDuration = 0

    for (const player of Object.keys(intermediateScore)) {
      const notesAtTimes = intermediateScore[player as Player]
      const times = Object.keys(notesAtTimes)
      const lastTime = parseFloat(times[times.length - 1])
      const lastNoteSet = notesAtTimes[lastTime]

      const highestDurationForPlayer = [...lastNoteSet].sort(
        (a, b) => b.duration - a.duration
      )[0].duration

      if (highestDurationForPlayer > highestDuration) {
        highestDuration = highestDurationForPlayer
        offsetOfHighestDurationNote = lastTime
      }
    }

    return Math.ceil(highestDuration + offsetOfHighestDurationNote)
  }

  calculateScorePitchRange(
    intermediateScore: Record<Player, Record<number, ParsedNote[]>>
  ): { lowest: number; highest: number } {
    let highestPitch = 0
    let lowestPitch = 128

    for (const player of Object.keys(intermediateScore)) {
      const notesAtTimes = intermediateScore[player as Player]
      const times = Object.keys(notesAtTimes)

      for (const time of times) {
        const noteSet = notesAtTimes[parseFloat(time)]

        for (const note of noteSet) {
          if (!note || note.rest) {
            continue
          }
          if (!note.pitch.step) {
            console.log(
              'Note has no pitch:',
              note.pitch,
              'at time',
              time,
              'for player',
              player
            )
          }
          const pitch = PitchToByte(note.pitch)
          if (pitch > highestPitch) {
            highestPitch = pitch
          }
          if (pitch < lowestPitch) {
            lowestPitch = pitch
          }
        }
      }
    }

    return {
      lowest: lowestPitch,
      highest: highestPitch
    }
  }

  calculateMeasureDivisionBoundaries(
    intermediateScore: Record<Player, Record<number, ParsedNote[]>>
  ): MeasureBoundary[] {
    const measureBoundaries: MeasureBoundary[] = []
    let prevMeasureBoundary = {
      measureNumber: 0,
      leftEdge: 0,
      rightEdge: -1
    }

    for (const player of Object.keys(intermediateScore)) {
      const notesAtTimes = intermediateScore[player as Player]
      const times = Object.keys(notesAtTimes)

      for (const time of times) {
        const floatTime = parseFloat(time)
        const firstNote = notesAtTimes[floatTime][0]

        if (!firstNote) {
          continue
        }

        const measure = firstNote.measure

        if (measure !== prevMeasureBoundary.measureNumber) {
          prevMeasureBoundary.rightEdge = floatTime
          measureBoundaries.push(prevMeasureBoundary)
          prevMeasureBoundary = {
            measureNumber: measure,
            leftEdge: prevMeasureBoundary.rightEdge,
            rightEdge: -1
          }
        }
      }

      const lastMeasureOffset = parseFloat(times[times.length - 1])
      prevMeasureBoundary.rightEdge = lastMeasureOffset
      measureBoundaries.push(prevMeasureBoundary)

      break
    }

    return measureBoundaries
  }

  constructCachedNoteSetsByMeasure(
    input: Record<Player, Record<number, ParsedNote[]>>
  ): Record<Player, Record<number, CachedMeasureInfo>> {
    const result: Record<Player, Record<number, CachedMeasureInfo>> = {
      'player-computer': {},
      'player-left-hand': {},
      'player-muted': {},
      'player-right-hand': {}
    }

    const noteTimesAcrossPlayers: Record<number, number> = {}

    function processPlayerNoteSet({
      noteSet,
      player,
      noteSetTime
    }: {
      noteSet: ParsedNote[]
      player: Player
      noteSetTime: number
    }) {
      let firstAvailableNote: ParsedNote | undefined = undefined

      for (let noteIdx = 0; noteIdx < noteSet.length; noteIdx++) {
        const tentativeNote = noteSet[noteIdx]

        if (tentativeNote) {
          firstAvailableNote = tentativeNote
          break
        }
      }

      if (typeof firstAvailableNote === 'undefined') {
        return
      }

      const measure = firstAvailableNote.measure

      if (!result[player]) {
        result[player] = {}
      }

      if (!result[player][measure]) {
        result[player][measure] = {
          maxOffsetTime: 0,
          noteSets: [],
          matchingNoteSetTimes: [],
          minOffsetTime: Number.MAX_SAFE_INTEGER
        }
      }

      result[player as Player][measure].noteSets.push({
        time: noteSetTime,
        noteSet
      })
    }

    // Loop through input
    for (const [player, playerNotes] of Object.entries(input)) {
      const noteSetTimes = Object.keys(playerNotes)
        .map((x) => parseFloat(x))
        .sort((a, b) => a - b)

      for (
        let noteSetTimeIdx = 0;
        noteSetTimeIdx < noteSetTimes.length;
        noteSetTimeIdx++
      ) {
        const noteSetTime = noteSetTimes[noteSetTimeIdx]
        const noteSet = playerNotes[noteSetTime]

        processPlayerNoteSet({
          noteSet,
          player: player as Player,
          noteSetTime
        })
      }
    }

    function processOutputCachedMeasureInfo({
      cachedMeasureInfo,
      players,
      measureNumbers,
      measureNumber,
      result
    }: {
      cachedMeasureInfo: CachedMeasureInfo
      players: Player[]
      measureNumbers: number[]
      measureNumber: number
      result: Record<Player, Record<number, CachedMeasureInfo>>
    }) {
      let maxOffsetTimeAcrossPlayers = 0
      let smallestOffsetTimeAcrossPlayers = Number.MAX_SAFE_INTEGER
      let matchingNoteSetTimesMap: Record<number, ParsedNote[]> = {}

      // For each player
      for (let playerIdx = 0; playerIdx < players.length; playerIdx++) {
        const player = players[playerIdx]
        const measureNumberToCachedMeasureInfo = result[player]

        const cachedMeasureInfo =
          measureNumberToCachedMeasureInfo[measureNumber]

        if (!cachedMeasureInfo) {
          // This player doesn't have any note sets in this measure (e.g. a left-hand only measure)
          continue
        }

        let largestTimeAndDuration = 0
        for (
          let noteSetIdx = 0;
          noteSetIdx < cachedMeasureInfo.noteSets.length;
          noteSetIdx++
        ) {
          const noteSetInfo = cachedMeasureInfo.noteSets[noteSetIdx]

          if (!matchingNoteSetTimesMap[noteSetInfo.time]) {
            matchingNoteSetTimesMap[noteSetInfo.time] = []
          }
          matchingNoteSetTimesMap[noteSetInfo.time] = matchingNoteSetTimesMap[
            noteSetInfo.time
          ].concat(noteSetInfo.noteSet)

          smallestOffsetTimeAcrossPlayers = Math.min(
            smallestOffsetTimeAcrossPlayers,
            noteSetInfo.time
          )
          for (const note of noteSetInfo.noteSet) {
            largestTimeAndDuration = Math.max(
              largestTimeAndDuration,
              noteSetInfo.time + (note?.duration || 0)
            )
          }

          // Store the greater of this player's measure's longest offset time + duration
          maxOffsetTimeAcrossPlayers = Math.max(
            maxOffsetTimeAcrossPlayers,
            largestTimeAndDuration
          )
        }
      }

      const matchingNoteSetTimes = Object.entries(matchingNoteSetTimesMap)
        .filter(
          ([noteSetTime, notes]) =>
            notes.filter((x) => x.staff === 1).length &&
            notes.filter((x) => x.staff === 2).length
        )
        .map(([noteSetTime, notes]) => parseFloat(noteSetTime))
        .sort((a, b) => a - b)

      cachedMeasureInfo.matchingNoteSetTimes = matchingNoteSetTimes

      // Now that we have the largest offset time across players for this measure
      // For each player
      for (let playerIdx = 0; playerIdx < players.length; playerIdx++) {
        const player = players[playerIdx]
        const measureNumberToCachedMeasureInfo = result[player]

        const cachedMeasureInfo =
          measureNumberToCachedMeasureInfo[measureNumber]

        if (!cachedMeasureInfo) {
          // This player doesn't have any note sets in this measure (e.g. a left-hand only measure)
          continue
        }

        // Use the greatest offset time across all players for each player
        cachedMeasureInfo.maxOffsetTime = maxOffsetTimeAcrossPlayers
        cachedMeasureInfo.minOffsetTime = smallestOffsetTimeAcrossPlayers
      }
    }

    // Loop through output
    {
      const players = Object.keys(result) as Player[]
      for (let playerIdx = 0; playerIdx < players.length; playerIdx++) {
        const player = players[playerIdx]
        const measureNumberToCachedMeasureInfo = result[player]

        const measureNumbers = Object.keys(
          measureNumberToCachedMeasureInfo
        ).map((x) => parseFloat(x))

        for (
          let measureNumberIdx = 0;
          measureNumberIdx < measureNumbers.length;
          measureNumberIdx++
        ) {
          const measureNumber = measureNumbers[measureNumberIdx]
          const cachedMeasureInfo =
            measureNumberToCachedMeasureInfo[measureNumber]

          processOutputCachedMeasureInfo({
            cachedMeasureInfo,
            players,
            measureNumbers,
            measureNumber,
            result
          })
        }
      }
    }

    return result
  }

  buildFromSynthesia2Midi(input: any): Performance {}

  build(input: ParsedScore): Performance {
    const context: ScoreBuilderContext = {
      logs: [],
      input
    }

    const defaultPlayerMapping: PlayerMapping[] = [
      {
        part: {
          number: 0,
          name: 'voice'
        },
        staff: 0,
        player: Player.RightHand
      },
      {
        part: {
          number: 0,
          name: 'voice'
        },
        staff: 1,
        player: Player.LeftHand
      },
      {
        part: {
          number: 0,
          name: 'piano'
        },
        staff: 0,
        player: Player.RightHand
      },
      {
        part: {
          number: 0,
          name: 'piano'
        },
        staff: 1,
        player: Player.LeftHand
      }
    ]

    const output1 = new PlayerPartitionProcessor(
      context,
      input,
      defaultPlayerMapping
    ).process()

    const output2 = new TieProcessor(context, output1).process()
    const output3 = new SimplificationProcessor(output2).process()
    const output4 = new EmptyNoteSetsProcessor(context, output3).process()

    const finalOutput = output4
    freeze(finalOutput)

    if (context.logs.length) {
      for (const log of context.logs) {
        console.log(`${log.severity}: ${log.message}`)
      }
    }

    const pitchRange = this.calculateScorePitchRange(finalOutput)

    return {
      intermediateScore: finalOutput,
      cachedNoteSetsByMeasure:
        this.constructCachedNoteSetsByMeasure(finalOutput),
      pitchRange
    }
  }
}
