import {
  Box,
  createStyles,
  IconButton,
  makeStyles,
  Theme,
  useMediaQuery,
  useTheme
} from '@material-ui/core'
import { mdiMenu, mdiMenuRight } from '@mdi/js'
import Icon from '@mdi/react'
import React, { useState } from 'react'
import { LEFT_PANE_BREAKPOINT } from '../vars'
import LeftPane, { LEFT_BAR_WIDTH } from './LeftPane'
import TopBar, { TOPBAR_HEIGHT } from './TopBar'

export default React.memo(function Layout({
  title,
  children,
  TopBarContents
}: {
  title: string
  TopBarContents?: React.ReactNode
  children: React.ReactNode
}) {
  const theme = useTheme()

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      menuButton: {
        marginRight: theme.spacing(0),
        [theme.breakpoints.up(LEFT_PANE_BREAKPOINT)]: {
          display: 'none'
        }
      }
    })
  )

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const classes = useStyles()
  const isLeftPaneBreakpointWidth = useMediaQuery(
    `(min-width:${LEFT_PANE_BREAKPOINT}px)`
  )

  const marginLeft =
    isMobileOpen || isLeftPaneBreakpointWidth ? LEFT_BAR_WIDTH : 0

  return (
    <Box id="layout/container" width="100%" height="100%">
      <LeftPane isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <Box
        marginLeft={`${marginLeft}px`}
        width={`calc(100% - ${marginLeft}px)`}
        height="100%"
        id="layout/contents"
        position="relative"
        display="flex"
        flexDirection="column"
      >
        <TopBar
          title={title}
          marginLeft={`${marginLeft}px`}
          MobileMenu={
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => {
                setIsMobileOpen((x) => !x)
              }}
              className={classes.menuButton}
            >
              <Icon
                path={mdiMenu}
                size="1.25em"
                color={theme.palette.primary.main}
              />
            </IconButton>
          }
        >
          {TopBarContents}
        </TopBar>
        <Box
          id="layout/contents"
          width="100%"
          height="100%"
          position="relative"
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
})
