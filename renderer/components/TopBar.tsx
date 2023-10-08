import React from 'react'
import { AppBar, Box, Typography, useTheme } from '@material-ui/core'
import { LEFT_BAR_WIDTH } from './LeftPane'

export const TOPBAR_HEIGHT = 65

export default React.memo(function TopBar({
  title,
  children,
  MobileMenu,
  marginLeft
}: {
  title: string
  children: React.ReactNode
  MobileMenu: React.ReactNode
  marginLeft: string
}) {
  const theme = useTheme()
  return (
    <AppBar
      position="sticky"
      elevation={0}
      style={{
        background: theme.palette.background.default,
        height: TOPBAR_HEIGHT,
        borderBottom: '1px solid hsl(214deg 26% 90%)',
        top: 0,
        left: marginLeft
      }}
    >
      <Box display="flex" alignItems="center" height="100%" marginX={3}>
        {MobileMenu}
        <Typography
          style={{
            fontSize: '1.35rem',
            color: theme.palette.primary.main,
            height: '1em',
            lineHeight: 1.175,
            fontWeight: 600
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </AppBar>
  )
})
