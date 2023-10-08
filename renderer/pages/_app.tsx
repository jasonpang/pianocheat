import React, { useEffect, useMemo } from 'react'
import Head from 'next/head'
import { ThemeProvider } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import { createTheme } from '../lib/theme'
import type { AppProps } from 'next/app'
import '../global.css'
import '../lib/persist'
import { SnackbarProvider } from 'notistack'
import { useMediaQuery } from '@material-ui/core'
// import '../lib/monacoEditorConfig'
import { disableElectronWarnings } from '../lib/disableElectronWarnings'

disableElectronWarnings()

export default function App(props: AppProps) {
  const { Component, pageProps } = props
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  useEffect(() => {
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles)
    }
  }, [])

  const theme = useMemo(
    () => createTheme({ prefersDarkMode }),
    [prefersDarkMode]
  )

  return (
    <React.Fragment>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <title>Piano Studio</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
        >
          <Component {...pageProps} />
        </SnackbarProvider>
      </ThemeProvider>
    </React.Fragment>
  )
}
