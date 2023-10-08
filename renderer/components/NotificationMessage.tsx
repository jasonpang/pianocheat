import React, { useState } from 'react'
import clsx from 'clsx'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { useSnackbar, VariantType } from 'notistack'
import Collapse from '@material-ui/core/Collapse'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import {
  mdiAlertDecagram,
  mdiCheckboxMarkedCircle,
  mdiCloseOctagon,
  mdiInformation
} from '@mdi/js'
import Icon from '@mdi/react'
import { Box } from '@material-ui/core'

export interface NotificationMessageProps {
  id?: string | number
  heading: string
  variant: VariantType
  content?: React.ReactNode
  duration?: number
}

function getColorsForVariant(variant: VariantType) {
  switch (variant) {
    default:
    case 'default':
      return {
        background: '#fff',
        color: 'rgb(51, 51, 51)'
      }
    case 'error':
      return {
        background: '#cf000f',
        color: '#fff'
      }
    case 'info':
      return {
        background: '#63c0df',
        color: '#fff'
      }
    case 'success':
      return {
        background: '#009944',
        color: '#fff'
      }
    case 'warning':
      return {
        background: '#f0541e',
        color: '#fff'
      }
  }
}

function getIconForVariant(variant: VariantType) {
  switch (variant) {
    default:
    case 'default':
      return {
        icon: null
      }
    case 'error':
      return {
        icon: mdiCloseOctagon
      }
    case 'info':
      return {
        icon: mdiInformation
      }
    case 'success':
      return {
        icon: mdiCheckboxMarkedCircle
      }
    case 'warning':
      return {
        icon: mdiAlertDecagram
      }
  }
}

const NotificationMessage = React.forwardRef(
  (props: NotificationMessageProps, ref) => {
    const { closeSnackbar } = useSnackbar()
    const [expanded, setExpanded] = useState(true)

    const handleExpandClick = () => {
      setExpanded(!expanded)
    }

    const handleDismiss = () => {
      closeSnackbar(props.id)
    }

    const colors = getColorsForVariant(props.variant)
    const icon = getIconForVariant(props.variant)

    const useStyles = makeStyles((theme: Theme) =>
      createStyles({
        card: {
          maxWidth: '98%',
          width: 350
        },
        heading: {
          fontWeight: 400,
          margin: 0,
          padding: 0,
          color: colors.color
        },
        typography: {
          fontWeight: 600
        },
        actionRoot: {
          padding: '6px 6px 6px 16px',
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        },
        icons: {
          marginLeft: 'auto'
        },
        expand: {
          padding: '4px 4px',
          transform: 'rotate(0deg)',
          transition: theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest
          }),
          color: colors.color
        },
        expandOpen: {
          transform: 'rotate(180deg)'
        },
        collapse: {
          padding: 16
        },
        checkIcon: {
          fontSize: 20,
          color: '#b3b3b3',
          paddingRight: 4
        },
        button: {
          padding: 0
        }
      })
    )
    const classes = useStyles()

    return (
      <Card className={classes.card} ref={ref}>
        <CardActions classes={{ root: classes.actionRoot }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{
              transform: 'translateY(10%)'
            }}
          >
            {icon.icon ? (
              <Box marginRight={1}>
                <Icon
                  path={icon.icon}
                  size="1.5em"
                  color="white"
                  style={{
                    lineHeight: 0
                  }}
                />
              </Box>
            ) : null}
            <Typography variant="subtitle2" className={classes.heading}>
              {props.heading}
            </Typography>
          </Box>
          <div className={classes.icons}>
            {props.content ? (
              <IconButton
                aria-label="Show more"
                className={clsx(classes.expand, {
                  [classes.expandOpen]: expanded
                })}
                onClick={handleExpandClick}
              >
                <ExpandMoreIcon />
              </IconButton>
            ) : null}
            <IconButton className={classes.expand} onClick={handleDismiss}>
              <CloseIcon />
            </IconButton>
          </div>
        </CardActions>
        {props.content ? (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Paper className={classes.collapse}>{props.content}</Paper>
          </Collapse>
        ) : null}
      </Card>
    )
  }
)

export default NotificationMessage
