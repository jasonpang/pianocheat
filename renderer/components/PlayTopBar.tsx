import React from 'react'
import { Box, IconButton, useTheme } from '@material-ui/core'
import { ActiveMode, useStore } from '../lib/store'
import Icon from '@mdi/react'
import { mdiPause, mdiPlay } from '@mdi/js'
import { play, stop } from '../audio/audio'
import { Player } from '../engine/builder/interfaces'
import { PitchToByte } from '../engine/builder/Utils'

export const TOPBAR_HEIGHT = 65

export default React.memo(function PlayTopBar() {
  const theme = useTheme()
  const update = useStore((x) => x.update)
  const activePerformance = useStore((x) => x.performance)
  const mode = activePerformance?.mode
  const preview = activePerformance?.preview

  function onPreviewStart() {
    if (!activePerformance?.score.performance) {
      return
    }

    const performance = activePerformance.score.performance
    const { intermediateScore } = performance

    update((draft) => {
      draft.performance!.mode = ActiveMode.Preview
      draft.performance!.preview.time = 0
      draft.performance!.preview.active = true
    })

    for (const player of Object.keys(intermediateScore)) {
      if ((player as Player) === Player.Muted) {
        continue
      }

      const notesAtTimes = intermediateScore[player as Player]
      const times = Object.keys(notesAtTimes)
        .map((x) => parseFloat(x))
        .sort((a, b) => a - b)

      for (const time of times) {
        const noteSet = notesAtTimes[time]

        for (const note of noteSet) {
          if (!note || !note.pitch) {
            continue
          }

          const pitch = PitchToByte(note.pitch)

          play({
            pitch,
            speed: 12,
            time: (player as Player) === Player.LeftHand ? time - 0.35 : time,
            duration: note.duration
          })
        }
      }
    }
  }

  function onPreviewPause() {
    if (!activePerformance?.score.performance) {
      return
    }

    stop()

    const performance = activePerformance.score.performance

    update((draft) => {
      draft.performance!.mode = ActiveMode.Preview
      draft.performance!.preview.active = false
    })
  }

  return (
    <Box display="flex" alignItems="center" marginX={3}>
      {mode === ActiveMode.Preview && !preview?.active && (
        <IconButton onClick={onPreviewStart}>
          <Icon
            path={mdiPlay}
            size="1.25em"
            color={theme.palette.primary.main}
          />
        </IconButton>
      )}
      {mode === ActiveMode.Preview && preview?.active && (
        <IconButton onClick={onPreviewPause}>
          <Icon
            path={mdiPause}
            size="1.25em"
            color={theme.palette.primary.main}
          />
        </IconButton>
      )}
    </Box>
  )
})
