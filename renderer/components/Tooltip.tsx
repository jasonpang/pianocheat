import React, { Fragment, ReactElement } from 'react'
import { Theme, makeStyles } from '@material-ui/core/styles'
import MuiTooltip, {
  TooltipProps as MuiTooltipProps
} from '@material-ui/core/Tooltip'
import { Box } from '@material-ui/core'

const useStylesBootstrap = makeStyles(() => ({
  tooltip: {
    backgroundColor: 'white',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    border: '1px solid white',
    boxShadow: '0 1px 3px 0 #d4d4d5, 0 0 0 1px #d4d4d5',
    padding: '4px'
  }
}))

export interface TooltipProps extends Partial<MuiTooltipProps> {
  content: string
  title?: string
  children: ReactElement<any, any>
}

export default function Tooltip(props: TooltipProps) {
  const classes = useStylesBootstrap()

  return (
    <MuiTooltip
      classes={classes}
      {...props}
      title={
        <Fragment>
          <Box>
            <pre>{props.content}</pre>
          </Box>
        </Fragment>
      }
    />
  )
}
