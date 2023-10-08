import React from 'react'
import Layout from '../components/Layout'
import PlayDropZone from '../components/PlayDropZone'
import PlayCanvas from '../components/PlayCanvas'
import { useStore } from '../lib/store'
import PlayTopBar from './PlayTopBar'

export default React.memo(function PlayPage() {
  const activePerformance = useStore((x) => x.performance)

  return (
    <Layout
      title={activePerformance?.score ? activePerformance.score.name : 'Play'}
      TopBarContents={<PlayTopBar />}
    >
      <PlayDropZone>
        <PlayCanvas />
      </PlayDropZone>
    </Layout>
  )
})
