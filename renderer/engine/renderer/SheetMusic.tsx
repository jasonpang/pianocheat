import { Box } from '@material-ui/core'
import fs from 'fs'
import React, { useEffect } from 'react'
import WebMidi from 'webmidi'
import { useStore } from '../../lib/store'
import { CANVAS_MARGIN } from '../../vars'
import ScoreBuilder from '../builder/ScoreBuilder'
import { RecordingEntry } from '../builder/interfaces'
import Midi from '../midi/Midi'
import MusicXmlParser from '../parser/MusicXmlParser'
import SingleVoicePlayback from '../performer/SingleVoicePlayback'
import MusicXmlReader from '../reader/MusicXmlReader'
import ScorePage from './ScorePage'

export interface SheetMusicProps {
  filePath: string
}

export default React.memo(function SheetMusic(props: SheetMusicProps) {
  const update = useStore((x) => x.update)
  const activePerformance = useStore((x) => x.performance)
  const { filePath } = props

  const performance = activePerformance?.score.performance

  useEffect(() => {
    if (filePath.endsWith('.json')) {
      console.log('Reading in recording...', filePath)
      const rawScore = fs.readFileSync(filePath, 'utf-8')

      ;(window as any).playRecording = async () => {
        const midi = new Midi()
        await midi.initialize()

        const output = WebMidi.outputs.filter(
          (x) =>
            x.name.toLowerCase().includes('E-MU XMidi1X1'.toLowerCase()) ||
            x.name.toLowerCase().includes('loopbe') ||
            x.name.toLowerCase().includes('iac driver')
        )[0]

        if (!output) {
          console.log('Could not find any usable default MIDI output.')
          return
        }

        const recording = JSON.parse(rawScore) as RecordingEntry[]

        const initialTimestamp = recording[0].timestamp

        const lastTimestamp = recording[recording.length - 1].timestamp
        const lastNotesOffTimestamp =
          WebMidi.time + (lastTimestamp - initialTimestamp)

        for (const event of recording) {
          const delta = event.timestamp - initialTimestamp
          const timestamp = WebMidi.time + delta

          switch (event.type) {
            case 'noteon':
              output.playNote(event.note, 1, {
                time: timestamp,
                rawVelocity: true,
                velocity: event.velocity
              })
              break
            case 'noteoff':
              output.stopNote(event.note, 1, {
                time: timestamp,
                rawVelocity: true,
                velocity: 64
              })
              break
            case 'controlchange':
              output.sendControlChange(event.controller, event.value, 1, {
                time: timestamp
              })
              break
          }
        }

        output.stopNote('all', 1, {
          time: lastNotesOffTimestamp,
          rawVelocity: true,
          velocity: 64
        })
      }
      ;(window as any).playRecording()
    } else {
      const rawScore = new MusicXmlReader().readFile(filePath)

      if (!rawScore) {
        return
      }

      const parsedScore = new MusicXmlParser(rawScore).parse()
      const performance = new ScoreBuilder().build(parsedScore)
      window.debug = performance

      const midi = new Midi()

      update(async (x) => {
        x.performance!.score.performance = performance
        const promise = midi.initialize()
        x.midi = midi
        x.performance!.cursors = {
          'player-left-hand': 0,
          'player-right-hand': 0,
          'player-computer': 0,
          'player-muted': 0
        }
        await promise
        ;(window as any).saveRecording = () => {
          const processor = midi.getProcessor()
          processor.saveRecording()
        }
        midi.setProcessor(
          new SingleVoicePlayback(performance.intermediateScore)
        )
      })

      // return () => {
      //   const processor = midi.getProcessor()
      //   if (processor) {
      //     processor.saveRecording()
      //   }
      // }
    }
  }, [filePath, update])

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
