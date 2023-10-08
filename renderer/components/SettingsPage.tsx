import { Box, CircularProgress } from '@material-ui/core'
import React, { useRef, useState } from 'react'
import { useNotification } from '../lib/useNotification'
import Editor, { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { AppConfig, useStore } from '../lib/store'
import Layout from './Layout'
import { PERSIST_FILE_PATH } from '../lib/persist'
import fs from 'fs'

export default function SettingsPage() {
  const notification = useNotification()
  const appConfig: AppConfig = useStore((state) => state.appConfig)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()

  function onEditorMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    setIsEditorReady(true)
    editorRef.current = editor
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
      onSaveEditorContents
    )
  }

  async function onSaveEditorContents() {
    const editorContents = editorRef.current?.getValue()

    if (!editorContents?.trim().length) {
      return
    }

    let newParsedSettings
    try {
      newParsedSettings = JSON.parse(editorContents)
    } catch (e) {
      notification?.notify({
        heading: `Settings can't be saved.`,
        variant: 'warning',
        content: (
          <Box>
            <p>The settings could not be saved because it is not valid JSON.</p>
            <p>Edit the content and try again.</p>
            <p>{e.message}</p>
          </Box>
        )
      })
      return
    }

    try {
      fs.writeFileSync(
        PERSIST_FILE_PATH,
        JSON.stringify(newParsedSettings, null, 4),
        {
          encoding: 'utf-8'
        }
      )
    } catch (e) {
      notification?.notify({
        heading: `Error saving settings.`,
        variant: 'error',
        content: <Box>{e.message}</Box>
      })
      return
    }
    notification?.notify({
      heading: `Saved settings successfully.`,
      variant: 'success'
    })
  }
  return (
    <Layout title="Settings">
      <Box
        paddingY={1}
        style={{
          background: 'white'
        }}
      />
      <Editor
        height="90vh"
        value={JSON.stringify(appConfig, null, 4)}
        language="javascript"
        onMount={onEditorMount}
        options={{
          minimap: {
            enabled: false
          }
        }}
      />
      {!isEditorReady && <CircularProgress />}
    </Layout>
  )
}
