import { Box, useMediaQuery } from '@material-ui/core'
import React, { useCallback, useMemo, useState } from 'react'
import { Player } from '../builder/interfaces'
import {
  DARK_LINE_COLOR,
  LIGHT_LINE_COLOR,
  MEASURE_RADIUS,
  NOTE_BOX_SHADOW,
  NOTE_COLOR_PLAYER_LEFT_HAND,
  NOTE_COLOR_PLAYER_RIGHT_HAND,
  NOTE_WIDTH,
  VERTICAL_SPACE_BETWEEN_MEASURE_ROWS
} from '../../vars'
import StaffNotes from './StaffNotes'
import { useStore } from '../../lib/store'

export interface MeasureProps {
  scoreMeasureIdx: number
  key?: string
  isFirstMeasureInRow: boolean
  isLastMeasureInRow: boolean
}

export default React.memo(function Measure(props: MeasureProps) {
  const update = useStore((x) => x.update)
  const appConfig = useStore((x) => x.appConfig)
  const noteSets = useStore(
    (x) => x.performance?.score.performance.intermediateScore
  )
  const cachedNoteSetsByMeasure = useStore(
    (x) => x.performance?.score.performance.cachedNoteSetsByMeasure
  )
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const lineColor = useMemo(
    () => (prefersDarkMode ? DARK_LINE_COLOR : LIGHT_LINE_COLOR),
    [prefersDarkMode]
  )
  const [measureDimensions, setMeasureDimensions] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })

  const onRefChange = useCallback(
    (node) => {
      if (node !== null) {
        const { x, y, width, height } = node.getBoundingClientRect()
        setMeasureDimensions({
          x,
          y,
          width,
          height
        })
      }
    },
    [setMeasureDimensions]
  )

  return (
    <div
      id={`measure/${props.scoreMeasureIdx + 1}`}
      // ref={onRefChange}
      style={{
        position: 'relative',
        borderRight: `1px solid ${lineColor}`,
        borderTop: `1px solid ${lineColor}`,
        borderBottom: `1px solid ${lineColor}`,
        borderLeft: props.isFirstMeasureInRow
          ? `1px solid ${lineColor}`
          : 'none',
        width: '100%',
        height: '100%',
        overflow: props.isLastMeasureInRow ? 'hidden' : 'visible',
        borderTopLeftRadius: props.isFirstMeasureInRow ? MEASURE_RADIUS : 0,
        borderBottomLeftRadius: props.isFirstMeasureInRow ? MEASURE_RADIUS : 0,
        borderTopRightRadius: props.isLastMeasureInRow ? MEASURE_RADIUS : 0,
        borderBottomRightRadius: props.isLastMeasureInRow ? MEASURE_RADIUS : 0
      }}
    >
      <Box
        id={`measure-number/${props.scoreMeasureIdx + 1}`}
        position="absolute"
        top={0}
        // left={(isMeasureBoundary ? -2 : 0) + i * NOTE_WIDTH}
        left={0}
        style={{
          fontSize: '150%',
          fontFamily: 'Crimson Pro',
          transform: 'translateX(0.5em)',
          zIndex: 1,
          cursor: 'pointer'
        }}
        onClick={() => {
          const newMeasureNumber = props.scoreMeasureIdx
          if (!noteSets || !cachedNoteSetsByMeasure) {
            return
          }

          for (const _player of Object.keys(noteSets)) {
            const player = _player as Player
            console.log('player:', player)
            console.log('newMeasureNumber:', newMeasureNumber)
            const measureInfoForPlayer =
              cachedNoteSetsByMeasure[player][newMeasureNumber]

            console.log('measureInfoForPlayer:', measureInfoForPlayer)

            let targetNoteSetTime: number = 0
            if (!measureInfoForPlayer) {
              // First measure may only have right hand and no left hand
              // And jumping is asking both hands to find first note for each hand
              // Keep going until we find a measure that has something
              for (let i = newMeasureNumber; i < 9999; i++) {
                let scanNextMeasureInfoForPlayer =
                  cachedNoteSetsByMeasure[player][newMeasureNumber]
                if (scanNextMeasureInfoForPlayer) {
                  targetNoteSetTime =
                    scanNextMeasureInfoForPlayer.noteSets[0].time
                }
              }
            } else {
              targetNoteSetTime = measureInfoForPlayer.noteSets[0].time
            }

            const noteSetTimesAsFloat = Object.keys(noteSets[player])
              .map((x) => parseFloat(x))
              .sort((a, b) => a - b)

            const noteSetTimesWithoutRests = noteSetTimesAsFloat
              .filter((noteSetTime) => {
                const noteSetAtTime = noteSets[player][noteSetTime]
                const isNoteSetAllRests =
                  noteSetAtTime.filter((x) => x.rest).length ===
                  noteSetAtTime.length

                return !isNoteSetAllRests
              })
              .sort((a, b) => a - b)

            const noteSetWithoutRestsIdx = noteSetTimesWithoutRests.findIndex(
              (x) => x >= targetNoteSetTime
            )

            if (noteSetWithoutRestsIdx === -1) {
              console.log(
                'Could not update to measure.',
                Object.keys(noteSets),
                targetNoteSetTime
              )
              return
            }

            const noteSetTime = noteSetTimesWithoutRests[noteSetWithoutRestsIdx]
            const noteSetRegularIdx = noteSetTimesAsFloat.findIndex(
              (x) => x === noteSetTime
            )
            update((x) => {
              x.performance!.cursors[player] = noteSetRegularIdx
            })
          }
        }}
      >
        {props.scoreMeasureIdx + 1}
      </Box>
      <Box
        id="notes/layout-container"
        position="absolute"
        width="100%"
        height="100%"
        display="grid"
        gridTemplateRows={`1fr ${VERTICAL_SPACE_BETWEEN_MEASURE_ROWS}px 1fr`}
      >
        {[...Array(3)].map((_, staffLineIdx) => {
          if (staffLineIdx === 1) {
            return <Box key={staffLineIdx} />
          }

          const player = staffLineIdx === 0 ? Player.RightHand : Player.LeftHand
          const isTrebleClef = player === Player.RightHand

          const background = isTrebleClef
            ? NOTE_COLOR_PLAYER_RIGHT_HAND
            : NOTE_COLOR_PLAYER_LEFT_HAND

          const boxShadow = NOTE_BOX_SHADOW

          return (
            <Box
              key={staffLineIdx}
              id={`${isTrebleClef ? 'treble' : 'bass'}/measure/${
                props.scoreMeasureIdx + 1
              }/notes`}
              position="relative"
              width="fit-content"
              height="100%"
              display="flex"
            >
              <StaffNotes
                player={player}
                measureIdx={props.scoreMeasureIdx}
                background={background}
                boxShadow={boxShadow}
                isTrebleClef={isTrebleClef}
                lineColor={lineColor}
              />
            </Box>
          )
        })}
      </Box>
    </div>
  )
})
