// @refresh reset
import { Box } from '@material-ui/core'
import React, { useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../../lib/store'
import { clamp } from '../../lib/utils'
import { VERTICAL_SPACE_BETWEEN_MEASURE_ROWS } from '../../vars'
import Measure from './Measure'
import electron from 'electron'
import range from 'lodash.range'
import { Player } from '../builder/interfaces'
import { usePrevious } from '../../components/usePrevious'
import WebMidi, {
  InputEventNoteon,
  InputEventNoteoff,
  Output,
  InputEventControlchange
} from 'webmidi'

const ROWS_PER_PAGE = 2
export interface ScorePageProps {
  measuresPerRow: number
}

/**
 * [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
 *     ^              ^
 *    low            high
 */
export default React.memo(function ScorePage(props: ScorePageProps) {
  const update = useStore((x) => x.update)
  const cursors = useStore((x) => x.performance?.cursors) || {
    'player-left-hand': 0,
    'player-right-hand': 0
  }
  const noteSets = useStore(
    (x) => x.performance?.score.performance.intermediateScore
  )
  const pageNumber = useStore((x) => x.performance?.pageNumber) || 1
  const lowStart = useMemo(
    () => (pageNumber - 1) * props.measuresPerRow + 1,
    [pageNumber]
  )
  const highEnd = useMemo(
    () => pageNumber * props.measuresPerRow + props.measuresPerRow,
    [pageNumber]
  )
  const lowEnd = useMemo(
    () => Math.floor((highEnd + lowStart) / 2),
    [lowStart, highEnd]
  )
  const highStart = useMemo(
    () => Math.floor((highEnd + lowStart) / 2) + 1,
    [lowStart, highEnd]
  )
  const shouldFlipScorePage = pageNumber % 2 === 0
  const topMeasuresRange = shouldFlipScorePage
    ? [highStart, highEnd]
    : [lowStart, lowEnd]
  const bottomMeasuresRange = shouldFlipScorePage
    ? [lowStart, lowEnd]
    : [highStart, highEnd]

  function onNavigateForward() {
    update((draft) => {
      draft.performance!.pageNumber = clamp(
        (draft.performance!.pageNumber || 1) + 1,
        1,
        999
      )
    })
  }

  function onNavigateBackward() {
    update((draft) => {
      draft.performance!.pageNumber = clamp(
        (draft.performance!.pageNumber || 1) - 1,
        1,
        999
      )
    })
  }

  const currentMeasure = useMemo(() => {
    const furtherPlayer =
      cursors[Player.LeftHand] > cursors[Player.RightHand]
        ? Player.LeftHand
        : Player.RightHand

    const higherCursor = cursors[furtherPlayer]
    const noteSetsForPlayer = noteSets![furtherPlayer]
    const noteSetTimesForPlayer = Object.keys(noteSetsForPlayer)
      .map((x) => parseFloat(x))
      .sort((a, b) => a - b)
    const noteSetTimeForCursor = noteSetTimesForPlayer[higherCursor]
    let noteSet = noteSetsForPlayer[noteSetTimeForCursor]

    if (!noteSet || !noteSet[0]) {
      noteSet = noteSetsForPlayer[noteSetTimesForPlayer[higherCursor - 1]]
      if (!noteSet || !noteSet[0]) {
        noteSet = noteSetsForPlayer[noteSetTimesForPlayer[higherCursor - 2]]
        return noteSet[0].measure
      }
    }
    const currentMeasure = noteSet[0].measure
    return currentMeasure + 1
  }, [cursors, noteSets])
  const previousMeasure = usePrevious(currentMeasure)

  useEffect(() => {
    if (
      previousMeasure &&
      previousMeasure === currentMeasure - 1 &&
      currentMeasure >= highStart
    ) {
      onNavigateForward()
    }
  }, [currentMeasure])

  useEffect(() => {
    const BrowserWindow = electron.remote.BrowserWindow
    const window = BrowserWindow.getAllWindows()[0]

    window.webContents.removeAllListeners('before-input-event')
    window.webContents.on(
      'before-input-event',
      (event: electron.Event, input: electron.Input) => {
        if (input.type === 'keyDown') {
          if (input.key === 'ArrowRight') {
            onNavigateForward()
          } else if (input.key === 'ArrowLeft') {
            onNavigateBackward()
          }
        }
      }
    )
  }, [])

  return (
    <Box
      id={`score-page`}
      position="relative"
      width="100%"
      height="100%"
      display="grid"
      gridTemplateColumns={`repeat(${props.measuresPerRow}, 1fr)`}
      gridTemplateRows={`repeat(${ROWS_PER_PAGE}, 1fr)`}
      gridRowGap={`${VERTICAL_SPACE_BETWEEN_MEASURE_ROWS}px`}
    >
      {[...Array(ROWS_PER_PAGE)].map((_, rowIdx) => {
        let [low, high] = rowIdx === 0 ? topMeasuresRange : bottomMeasuresRange

        return range(low, high + 1).map((_rowMeasureIdx) => {
          const scoreMeasureIdx = _rowMeasureIdx - 1
          return (
            <Measure
              key={`row/${rowIdx}/measure/${scoreMeasureIdx}`}
              isFirstMeasureInRow={scoreMeasureIdx === low - 1}
              isLastMeasureInRow={scoreMeasureIdx === high - 1}
              scoreMeasureIdx={scoreMeasureIdx}
            />
          )
        })
      })}
    </Box>
  )
})
