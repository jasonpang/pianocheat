import { createMuiTheme } from '@material-ui/core/styles'
import red from '@material-ui/core/colors/red'

export const createTheme = ({
  prefersDarkMode
}: {
  prefersDarkMode: boolean
}) =>
  createMuiTheme({
    typography: {
      fontFamily: 'Cerebri Sans'
    },
    overrides: {
      MuiCssBaseline: {
        '@global': {
          '@font-face': {
            fontFamily: 'Cerebri Sans',
            fontWeight: 400
          },
          html: {
            userSelect: 'none',
            outline: 'none'
          }
        }
      }
    },
    palette: {
      type: prefersDarkMode ? 'dark' : 'light',
      primary: {
        main: prefersDarkMode ? '#fff' : 'rgb(31, 31, 31)'
      },
      secondary: {
        main: '#19857b'
      },
      error: {
        main: red.A400
      },
      background: {
        default: prefersDarkMode ? 'rgb(51, 51, 51)' : '#fff'
      }
    }
  })
