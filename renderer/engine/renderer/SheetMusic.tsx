import { Box } from '@material-ui/core'
import React, { useEffect } from 'react'
import { useStore } from '../../lib/store'
import ScoreBuilder from '../builder/ScoreBuilder'
import MusicXmlParser from '../parser/MusicXmlParser'
import MusicXmlReader from '../reader/MusicXmlReader'
import { CANVAS_MARGIN } from '../../vars'
import ScorePage from './ScorePage'
import SingleVoicePlayback from '../performer/SingleVoicePlayback'
import Midi from '../midi/Midi'

export interface SheetMusicProps {
  filePath: string
}

export default React.memo(function SheetMusic(props: SheetMusicProps) {
  const update = useStore((x) => x.update)
  const activePerformance = useStore((x) => x.performance)
  const { filePath } = props

  const performance = activePerformance?.score.performance

  useEffect(() => {
    const rawScore = new MusicXmlReader().readFile(filePath)

    if (!rawScore) {
      return
    }

    const parsedScore = new MusicXmlParser(rawScore).parse()
    const performance = new ScoreBuilder().build(parsedScore)
    window.debug = performance

    update(async (x) => {
      x.performance!.score.performance = performance
      const midi = new Midi()
      const promise = midi.initialize()
      x.midi = midi
      x.performance!.cursors = {
        'player-left-hand': 0,
        'player-right-hand': 0,
        'player-computer': 0,
        'player-muted': 0
      }
      await promise
      midi.setProcessor(new SingleVoicePlayback(performance.intermediateScore))
    })
  }, [filePath])

  if (!performance) {
    return null
  }

  return (
    <Box
      id="sheet-music/container/test"
      position="relative"
      width="100%"
      height={`calc(100% - ${CANVAS_MARGIN * 2}px)`}
      display="flex"
      flexDirection="column"
      style={{
        margin: CANVAS_MARGIN
      }}
    >
      <ScorePage measuresPerRow={3} />
    </Box>
  )
})
