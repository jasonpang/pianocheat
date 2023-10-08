import React from 'react'
import { Box } from '@material-ui/core'
import { useStore } from '../lib/store'
import SheetMusic from '../engine/renderer/SheetMusic'

export interface PlayCanvasProps {
  children?: React.ReactNode
}

export default React.memo(function PlayCanvas({}: PlayCanvasProps) {
  const activePerformance = useStore((x) => x.performance)

  return (
    <Box
      id="play/canvas"
      width="100%"
      height="100%"
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
    >
      {activePerformance?.score?.musicXmlPath && (
        <SheetMusic filePath={activePerformance.score.musicXmlPath} />
      )}
    </Box>
  )
})
