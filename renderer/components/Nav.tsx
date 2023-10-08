import { ListItem, Box, Typography } from '@material-ui/core'
import React from 'react'
import { mdiMusic, mdiCog } from '@mdi/js'
import Icon from '@mdi/react'
import Link from './Link'
import { useRouter } from 'next/router'

const NavItems = [
  {
    icon: mdiMusic,
    iconProps: {},
    href: '/play',
    label: 'Play'
  },
  {
    icon: mdiCog,
    iconProps: {},
    href: '/settings',
    label: 'Settings'
  }
]

export default function Nav() {
  const router = useRouter()

  return (
    <Box marginY={0}>
      {NavItems.map(({ icon, label, href }) => {
        const isPathActive = router.pathname.startsWith(href)
        return (
          <Link href={href} key={label}>
            <Box
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              style={{
                background: isPathActive ? 'hsl(207deg 95% 53%)' : 'transparent'
              }}
            >
              <ListItem button>
                <Box
                  display="flex"
                  justifyContent="flex-start"
                  alignItems="center"
                  // width="100%"
                  paddingY={1.25}
                  paddingX={1}
                  marginLeft={2}
                >
                  <Box
                    marginRight={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon path={icon} size="1.25em" color="white" />
                  </Box>
                  <Typography
                    style={{
                      color: 'white',
                      fontWeight: 300,
                      fontSize: '120%',
                      textShadow: '0px -1px 1px rgba(0, 0, 0, 0.4)'
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              </ListItem>
            </Box>
          </Link>
        )
      })}
    </Box>
  )
}
