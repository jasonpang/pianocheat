import { Box } from '@material-ui/core'
import React, { Fragment, useMemo } from 'react'
import { useStore } from '../../lib/store'
import {
  MAX_NOTE_DURATION,
  NOTE_HEIGHT,
  NOTE_MARGIN,
  NOTE_WIDTH
} from '../../vars'
import { Player } from '../builder/interfaces'
import { PitchToByte } from '../builder/Utils'

export interface StaffNoteProps {
  pitch: number
  duration: number
  boxShadow: string
  offsetTime: number
  background: string
  noteIdx: number
  isTrebleClef: boolean
  highestPitch: number
  lowestPitch: number
}

function scale(original: number[], newMin: number, newMax: number) {
  var max = Math.max.apply(Math, original)
  var min = Math.min.apply(Math, original)
  return original.map(
    (num) => ((newMax - newMin) * (num - min)) / (max - min) + newMin
  )
}

const StaffNote = React.memo(function StaffNote(props: StaffNoteProps) {
  // Forget anything longer than a quarter note, it looks messy
  let transformedDuration = props.duration
  if (transformedDuration > MAX_NOTE_DURATION) {
    transformedDuration = MAX_NOTE_DURATION
  }

  const pitchByte = props.pitch
  const minPitch = props.isTrebleClef
    ? props.highestPitch / 2
    : props.lowestPitch
  const maxPitch = props.isTrebleClef
    ? props.highestPitch
    : props.highestPitch / 2

  // const minPitch = props.isTrebleClef ? 108 / 2 : 12
  // const maxPitch = props.isTrebleClef ? 108 : 108 / 2

  return (
    <Box
      id="note"
      data-duration={transformedDuration}
      data-width={transformedDuration * NOTE_WIDTH - NOTE_MARGIN * 2}
      style={{
        position: 'absolute',
        bottom: `${
          ((pitchByte - minPitch) / maxPitch) *
          100 *
          (props.isTrebleClef ? 1.5 : 1.5)
        }%`,
        padding: 0,
        margin: 0,
        borderRadius: '4px',
        height: NOTE_HEIGHT - NOTE_MARGIN * 2,
        background: props.background,
        boxShadow: props.boxShadow,
        width: transformedDuration * NOTE_WIDTH - NOTE_MARGIN * 2
      }}
    ></Box>
  )
})

export interface StaffNotesProps {
  player: Player
  measureIdx: number
  background: string
  boxShadow: string
  isTrebleClef: boolean
  lineColor: string
}

export default React.memo(function StaffNotes(props: StaffNotesProps) {
  const noteSetsForPlayer = useStore(
    (x) => x.performance?.score.performance.intermediateScore[props.player]
  )
  const cursor = useStore((x) => x.performance?.cursors[props.player]) || 0
  if (!noteSetsForPlayer) {
    return null
  }

  const noteSetTimes = useMemo(
    () =>
      Object.keys(noteSetsForPlayer)
        .map((x) => parseFloat(x))
        .sort((a, b) => a - b),
    [noteSetsForPlayer]
  )
  const noteSetTimeForCursor = noteSetTimes[cursor]
  const { lowest, highest } = useStore(
    (x) => x.performance?.score.performance.pitchRange
  )
  const cachedMeasureInfo = useStore(
    (x) =>
      x.performance?.score.performance.cachedNoteSetsByMeasure[props.player][
        props.measureIdx
      ]
  )

  if (!cachedMeasureInfo?.noteSets) {
    return null
  }

  const maxOffsetTime = cachedMeasureInfo.maxOffsetTime
  const minTime = cachedMeasureInfo.minOffsetTime

  return (
    <Fragment>
      {[...Array(cachedMeasureInfo.noteSets.length)].map((_, noteSetIdx) => {
        if (!cachedMeasureInfo) {
          return null
        }

        const noteSetInfo = cachedMeasureInfo.noteSets[noteSetIdx]
        const longestDuration = [...noteSetInfo.noteSet]
          .filter((x) => x.pitch?.step)
          .map((note) =>
            note.duration > MAX_NOTE_DURATION
              ? MAX_NOTE_DURATION
              : note.duration
          )
          .sort((a, b) => b - a)
        const isCursorOnCurrentNoteSet =
          noteSetTimeForCursor === noteSetInfo.time
        const isNoteSetAllRests =
          noteSetInfo.noteSet.filter((x) => x.rest).length ===
          noteSetInfo.noteSet.length

        if (isNoteSetAllRests) {
          return null
        }

        return (
          <Box
            key={noteSetIdx}
            data-noteset-time={noteSetInfo.time}
            id="noteset"
            display="flex"
            flexDirection="column"
            position="absolute"
            height="100%"
            top={0}
            width={Math.min(longestDuration[0], MAX_NOTE_DURATION) * NOTE_WIDTH}
            // ((noteSetInfo.time - minTime) / (maxOffsetTime - minTime)) * 100
            left={`${(noteSetInfo.time - minTime) * NOTE_WIDTH}px`}
            style={{
              background: isCursorOnCurrentNoteSet
                ? props.isTrebleClef
                  ? 'hsl(39 74% 91%)'
                  : 'hsl(192 47% 92%)'
                : 'none',
              padding: isCursorOnCurrentNoteSet ? 1 : 0,
              borderBottomLeftRadius: props.isTrebleClef ? 4 : 0,
              borderBottomRightRadius: props.isTrebleClef ? 4 : 0,
              borderTopLeftRadius: !props.isTrebleClef ? 4 : 0,
              borderTopRightRadius: !props.isTrebleClef ? 4 : 0
            }}
          >
            {[...Array(noteSetInfo.noteSet.length)].map((_, noteIdx) => {
              const note = noteSetInfo.noteSet[noteIdx]
              if (!note || note.rest) {
                return null
              }
              return (
                <StaffNote
                  key={`noteset/${noteSetIdx}/note/${noteIdx}`}
                  noteIdx={noteSetIdx}
                  pitch={PitchToByte(note.displayPitch)}
                  lowestPitch={lowest}
                  highestPitch={highest}
                  duration={note.duration}
                  offsetTime={noteSetInfo.time}
                  background={props.background}
                  boxShadow={props.boxShadow}
                  isTrebleClef={props.isTrebleClef}
                />
              )
            })}
          </Box>
        )
      })}
      <Box
        id="staff-lines/container"
        position="absolute"
        width="100%"
        height="100%"
        zIndex={-1}
      >
        {[...Array(cachedMeasureInfo.matchingNoteSetTimes.length)].map(
          (_, idx) => {
            const time = cachedMeasureInfo.matchingNoteSetTimes[idx]
            const isMatchingNoteSetTimeAtBeginningOfMeasure = time === minTime
            if (isMatchingNoteSetTimeAtBeginningOfMeasure) {
              // Do not highlight beginning of measure boundary matches with dashed lines
              return null
            }

            return (
              <Box
                id={`staff-line/${idx}`}
                key={idx}
                borderLeft={`1px dashed ${props.lineColor}`}
                // left={`${
                //   ((time - minTime) / (maxOffsetTime - minTime)) * 100
                // }%`}
                left={`${(time - minTime) * NOTE_WIDTH}px`}
                height="100%"
                position="absolute"
              />
            )
          }
        )}
      </Box>
    </Fragment>
  )
})
