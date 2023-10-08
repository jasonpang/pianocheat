import React, { useCallback, useEffect } from 'react'
import Typography from '@material-ui/core/Typography'
import { Box } from '@material-ui/core'
import { useDropzone } from 'react-dropzone'
import { ActiveMode, useStore } from '../lib/store'
import { getStartCaseFromFilePath } from '../lib/utils'

export default React.memo(function Play({
  children
}: {
  children?: React.ReactNode
}) {
  const update = useStore((x) => x.update)
  const appConfig = useStore((x) => x.appConfig)
  const performance = useStore((x) => x.performance)

  useEffect(() => {
    if (appConfig.defaultScore) {
      update((draft) => {
        draft.performance = {
          score: {
            musicXmlPath: appConfig.defaultScore,
            name: getStartCaseFromFilePath(appConfig.defaultScore)
          },
          mode: ActiveMode.Preview,
          preview: {
            time: 0
          }
        } as any
      })
    }
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    update((draft) => {
      const musicXmlFiles = acceptedFiles.filter((x) => x.path.endsWith('xml'))

      if (!musicXmlFiles.length) {
        return
      } else {
        draft.performance = {
          score: {
            musicXmlPath: musicXmlFiles[0].path,
            name: getStartCaseFromFilePath(musicXmlFiles[0].name)
          },
          mode: ActiveMode.Preview,
          preview: {
            time: 0
          }
        } as any
      }
    })
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 2 /* PDF and MusicXML files */,
    multiple: true,
    noClick: true
  })

  function renderNoInitialFile() {
    return (
      <Typography variant="body1" style={{ fontSize: '200%', fontWeight: 300 }}>
        Drag and drop a file to begin playing!
      </Typography>
    )
  }

  return (
    <Box
      id="play/dropzone"
      width="100%"
      height="100%"
      position="absolute"
      top={0}
      bottom={0}
      left={0}
      right={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{
        outline: 'none'
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {!performance?.score?.musicXmlPath && renderNoInitialFile()}
      {performance?.score?.musicXmlPath && children}
    </Box>
  )
})
