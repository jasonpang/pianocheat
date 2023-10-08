import { useSnackbar } from 'notistack'
import React from 'react'
import NotificationMessage, {
  NotificationMessageProps
} from '../components/NotificationMessage'
import { getRandomInt } from './random'

export function useNotification() {
  const snackbar = useSnackbar()

  const { enqueueSnackbar } = snackbar

  return {
    notify: (notification: NotificationMessageProps) => {
      return enqueueSnackbar(notification.heading, {
        variant: notification.variant,
        autoHideDuration: notification.duration
          ? notification.duration
          : notification.variant === 'success'
          ? 2000
          : 10000,
        content: (key) => (
          <NotificationMessage {...notification} id={key || getRandomInt()} />
        )
      })
    }
  }
}
