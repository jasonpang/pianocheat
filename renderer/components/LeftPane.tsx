import {
  makeStyles,
  Theme,
  createStyles,
  Drawer,
  Box,
  Hidden,
  useMediaQuery
} from '@material-ui/core'
import React from 'react'
import Nav from './Nav'
import { AppConfig, useStore } from '../lib/store'
import { LEFT_PANE_BREAKPOINT } from '../vars'

export const LEFT_BAR_WIDTH = 200

export default React.memo(function LeftPane({
  isMobileOpen,
  setIsMobileOpen
}: {
  isMobileOpen: boolean
  setIsMobileOpen: (isOpen: boolean) => void
}) {
  const isLeftPaneBreakpointWidth = useMediaQuery(
    `(min-width:${LEFT_PANE_BREAKPOINT}px)`
  )
  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        display: 'flex'
      },
      appBar: {
        width: `calc(100% - ${LEFT_BAR_WIDTH}px)`,
        marginLeft: LEFT_BAR_WIDTH
      },
      drawer: {
        width: LEFT_BAR_WIDTH,
        flexShrink: 0
      },
      drawerPaper: {
        width: LEFT_BAR_WIDTH,
        background: 'linear-gradient(#0470DC, #0BB1EC)',
        boxShadow: 'rgba(0, 0, 0, 0.24) 0px 0px 7px'
      },
      // necessary for content to be below app bar
      toolbar: theme.mixins.toolbar,
      content: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(3)
      }
    })
  )

  const classes = useStyles()

  const drawer = (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100%"
    >
      <Box display="flex" flexDirection="column">
        <Nav />
      </Box>
    </Box>
  )

  return (
    <nav>
      {isLeftPaneBreakpointWidth ? (
        <Drawer
          className={classes.drawer}
          variant="permanent"
          classes={{
            paper: classes.drawerPaper
          }}
          anchor="left"
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={isMobileOpen}
          onClose={() => {
            setIsMobileOpen(false)
          }}
          classes={{
            paper: classes.drawerPaper
          }}
          ModalProps={{
            keepMounted: true // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>
      )}
    </nav>
  )
})
