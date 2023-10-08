import { app, ProtocolResponse } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { protocol } from 'electron'
import installExtension, {
  REACT_DEVELOPER_TOOLS
} from 'electron-devtools-installer'

const port = process.argv[2]
const isProd: boolean = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

app.disableHardwareAcceleration()
;(async () => {
  await app.whenReady()

  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err))

  protocol.registerFileProtocol('file', (request, cb) => {
    const pathname = request.url.replace('file:///', '')
    cb(pathname)
  })

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home.html')
  } else {
    await mainWindow.loadURL(`http://localhost:${port}/home`)
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})
