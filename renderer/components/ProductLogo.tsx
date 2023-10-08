import { Box, Typography } from '@material-ui/core'
import React from 'react'

export default function ProductLogo() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <Typography
        style={{
          color: 'hsl(196 91% 78% / 1)',
          WebkitBackgroundClip: 'text',
          fontFamily: 'Poppins',
          fontSize: '150%',
          marginBottom: '0.65em'
        }}
      >
        Piano Studio
      </Typography>
    </Box>
  )
}
